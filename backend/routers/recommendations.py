from fastapi import APIRouter
from pydantic import BaseModel

from services.recommendation_service import compute_user_vector, get_recommendations

router = APIRouter()


class UserVector(BaseModel):
    bpm: float
    energy: float
    spectral_centroid: float
    valence: float
    danceability: float
    preferred_key: str | None
    play_count: int
    unique_tracks: int


@router.get("/vector")
async def get_user_vector() -> dict:
    """Get the computed user taste vector."""
    vector = await compute_user_vector()
    if not vector:
        return {"status": "insufficient_data", "message": "Play more tracks to get recommendations"}
    return {"status": "ok", "vector": vector}


@router.get("/tracks")
async def get_recommended_tracks(limit: int = 20) -> list:
    """Get recommended tracks based on user listening history."""
    recs = await get_recommendations(limit=limit)
    if not recs:
        return []
    return recs


@router.post("/index/build")
async def build_annoy_index() -> dict:
    """Build Annoy similarity index from all tracks with features."""
    from services.annoy_service import build_index

    result = await build_index()
    return result


@router.get("/similar")
async def get_similar_tracks(limit: int = 20) -> list:
    """Get similar tracks using Annoy index + user vector."""
    from services.annoy_service import query_similar
    from services.recommendation_service import compute_user_vector

    user_vector = await compute_user_vector()
    if not user_vector:
        return []

    results = query_similar(user_vector, n=limit)
    return results


@router.get("/")
async def get_recommendations_feed(limit: int = 20) -> list:
    """
    Main recommendations endpoint.
    Returns tracks similar to user vector, filtered by recently played.
    """
    from sqlalchemy import desc, select

    from database import AsyncSessionLocal
    from models import PlayHistory
    from services.annoy_service import build_index, query_similar
    from services.recommendation_service import compute_user_vector

    # Get user vector
    user_vector = await compute_user_vector()
    if not user_vector:
        # Cold start — return tracks with features sorted by energy
        from models import Track

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Track)
                .where(Track.bpm.isnot(None))
                .order_by(Track.energy.desc())
                .limit(limit)
            )
            tracks = result.scalars().all()
        return [
            {
                "video_id": t.video_id,
                "title": t.title,
                "artist": t.artist,
                "album": t.album,
                "duration_ms": t.duration_ms,
                "thumbnail_url": t.thumbnail_url,
                "bpm": t.bpm,
                "key": t.key,
                "energy": t.energy,
                "similarity": 0.5,
                "reason": "Popular",
            }
            for t in tracks
        ]

    # Only exclude if we have enough tracks (>10), otherwise show all
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PlayHistory.video_id).order_by(desc(PlayHistory.played_at)).limit(10)
        )
        all_recent = {row[0] for row in result.fetchall()}

    # Count total tracks with features
    from models import Track as TrackModel

    async with AsyncSessionLocal() as session:
        from sqlalchemy import func

        count_result = await session.execute(
            select(func.count()).select_from(TrackModel).where(TrackModel.bpm.isnot(None))
        )
        total_tracks = count_result.scalar()

    # Only filter if we have more tracks than we're excluding
    recent_ids = all_recent if total_tracks > len(all_recent) + 5 else set()

    # Rebuild index if needed
    from pathlib import Path

    if not Path("/tmp/soundfree_index/tracks_vectors.npy").exists():
        await build_index()

    # Query similar tracks
    results = query_similar(
        user_vector,
        n=limit + len(recent_ids),
        exclude_ids=recent_ids,
    )

    # Add reason labels
    bpm = user_vector.get("bpm", 0)
    for r in results:
        score = r.get("similarity", 0)
        track_bpm = r.get("bpm") or 0
        bpm_diff = abs(track_bpm - bpm)

        if score >= 0.999:
            r["reason"] = "Perfect Match"
        elif bpm_diff <= 10:
            r["reason"] = f"Similar BPM ({track_bpm:.0f})"
        elif score >= 0.99:
            r["reason"] = "Sounds Similar"
        else:
            r["reason"] = "You Might Like"

    return results[:limit]


@router.get("/cached")
async def get_cached_recommendations() -> list:
    """Serve recommendations from Redis cache (fast path)."""
    from cache import cache_get

    cached = await cache_get("recommendations:feed")
    if cached:
        pass
        return cached
    # Fall back to live computation
    return await get_recommendations_feed()


@router.post("/rebuild")
async def trigger_rebuild() -> dict:
    """Manually trigger recommendation rebuild."""
    from services.scheduler import rebuild_recommendations

    await rebuild_recommendations()
    return {"status": "rebuilt"}
