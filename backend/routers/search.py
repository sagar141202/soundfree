import hashlib

from fastapi import APIRouter, Query
from loguru import logger
from pydantic import BaseModel

from cache import cache_get, cache_set
from services.search_service import search_tracks

router = APIRouter()

SEARCH_CACHE_TTL = 60 * 30  # 30 minutes


class TrackResponse(BaseModel):
    video_id: str
    title: str
    artist: str
    album: str | None
    duration_ms: int | None
    thumbnail_url: str | None


def _cache_key(query: str, limit: int) -> str:
    raw = f"search:{query.lower().strip()}:{limit}"
    return "search:" + hashlib.md5(raw.encode()).hexdigest()


@router.get("", response_model=list[TrackResponse])
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(20, ge=1, le=50),
) -> list[TrackResponse]:
    cache_key = _cache_key(q, limit)

    # Check cache first
    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Cache HIT for search: '{q}'")
        return [TrackResponse(**t) for t in cached]

    # Cache miss — call ytmusicapi
    logger.info(f"Cache MISS for search: '{q}' — fetching from YouTube Music")
    results = await search_tracks(q.strip(), limit=limit)

    tracks = [
        TrackResponse(
            video_id=t.video_id,
            title=t.title,
            artist=t.artist,
            album=t.album,
            duration_ms=t.duration_ms,
            thumbnail_url=t.thumbnail_url,
        )
        for t in results
    ]

    # Store in cache
    await cache_set(cache_key, [t.model_dump() for t in tracks], SEARCH_CACHE_TTL)
    logger.info(f"Cached {len(tracks)} results for '{q}' (TTL: 30min)")

    return tracks
