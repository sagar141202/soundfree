import dataclasses

from fastapi import APIRouter
from loguru import logger

from cache import cache_get, cache_set
from services.search_service import search_tracks

router = APIRouter()

TRENDING_TTL = 60 * 60 * 6  # 6 hours

TRENDING_QUERIES = [
    "top hindi songs 2025",
    "trending bollywood music",
    "top telugu songs 2025",
    "viral india music 2025",
]


def _track_to_dict(track) -> dict:
    if dataclasses.is_dataclass(track):
        return dataclasses.asdict(track)
    if isinstance(track, dict):
        return track
    return {}


async def _fetch_trending() -> list:
    seen_ids: set[str] = set()
    results = []

    for query in TRENDING_QUERIES:
        try:
            tracks = await search_tracks(query, limit=6)
            for track in tracks:
                d = _track_to_dict(track)
                vid = d.get("video_id")
                if vid and vid not in seen_ids:
                    seen_ids.add(vid)
                    results.append(d)
                if len(results) >= 20:
                    break
        except Exception as e:
            logger.warning(f"Trending query failed '{query}': {e}")
            continue
        if len(results) >= 20:
            break

    logger.info(f"Fetched {len(results)} trending tracks")
    return results[:20]


@router.get("/")
async def get_trending(refresh: bool = False) -> list:
    cache_key = "trending:india"
    if not refresh:
        cached = await cache_get(cache_key)
        if cached:
            logger.info(f"Trending cache HIT ({len(cached)} tracks)")
            return cached
    logger.info("Fetching fresh trending tracks...")
    tracks = await _fetch_trending()
    if tracks:
        await cache_set(cache_key, tracks, TRENDING_TTL)
    return tracks


@router.get("/refresh")
async def refresh_trending() -> dict:
    tracks = await _fetch_trending()
    if tracks:
        await cache_set("trending:india", tracks, TRENDING_TTL)
    return {"status": "refreshed", "count": len(tracks)}
