import json

from fastapi import APIRouter, Query
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select

from cache import cache_get, cache_set
from config import settings
from database import AsyncSessionLocal
from models import LyricsCache, Track
from services.genius_service import get_lyrics_genius
from services.lyrics_service import get_lyrics_lrclib, search_lyrics_lrclib

router = APIRouter()

REDIS_TTL = 60 * 60 * 24 * 30  # 30 days


class LyricsLine(BaseModel):
    time_ms: int
    text: str


class LyricsResponse(BaseModel):
    video_id: str
    lines: list[LyricsLine]
    synced: bool
    source: str
    genius_url: str | None = None


async def _get_track_info(video_id: str) -> tuple[str, str, str | None]:
    try:
        async with AsyncSessionLocal() as session:
            track = await session.get(Track, video_id)
            if track:
                return track.artist, track.title, track.album
    except Exception:
        pass
    return "Unknown", "Unknown", None


async def _get_from_postgres(video_id: str) -> dict | None:
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(LyricsCache).where(LyricsCache.video_id == video_id)
            )
            row = result.scalar_one_or_none()
            if row:
                logger.info(f"Postgres HIT for lyrics: {video_id}")
                return json.loads(row.lyrics_json)
    except Exception as e:
        logger.warning(f"Postgres lyrics read error: {e}")
    return None


async def _save_to_postgres(video_id: str, data: dict) -> None:
    try:
        async with AsyncSessionLocal() as session:
            existing = await session.execute(
                select(LyricsCache).where(LyricsCache.video_id == video_id)
            )
            row = existing.scalar_one_or_none()
            if row:
                row.lyrics_json = json.dumps(data)
            else:
                session.add(
                    LyricsCache(
                        video_id=video_id,
                        lyrics_json=json.dumps(data),
                    )
                )
            await session.commit()
            logger.info(f"Saved lyrics to Postgres: {video_id}")
    except Exception as e:
        logger.warning(f"Postgres lyrics write error: {e}")


@router.get("/{video_id}", response_model=LyricsResponse)
async def get_lyrics(
    video_id: str,
    artist: str = Query(default=None),
    title: str = Query(default=None),
) -> LyricsResponse:
    cache_key = f"lyrics:{video_id}"

    # 1. Redis cache
    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Redis HIT for lyrics: {video_id}")
        return LyricsResponse(**cached)

    # 2. Postgres cache
    pg_cached = await _get_from_postgres(video_id)
    if pg_cached:
        await cache_set(cache_key, pg_cached, REDIS_TTL)
        return LyricsResponse(**pg_cached)

    # 3. Fetch from external APIs
    if not artist or not title:
        artist, title, album = await _get_track_info(video_id)
    else:
        album = None

    logger.info(f"Fetching lyrics: {artist} — {title}")

    result = await get_lyrics_lrclib(artist, title, album)
    if not result:
        result = await search_lyrics_lrclib(artist, title)
    if not result and settings.genius_access_token:
        result = await get_lyrics_genius(artist, title, settings.genius_access_token)
    if not result:
        result = {
            "lines": [{"time_ms": 0, "text": "Lyrics not available for this track."}],
            "synced": False,
            "source": "none",
        }

    response = LyricsResponse(
        video_id=video_id,
        lines=[LyricsLine(**line) for line in result["lines"]],
        synced=result.get("synced", False),
        source=result.get("source", "none"),
        genius_url=result.get("genius_url"),
    )

    data = response.model_dump()
    await cache_set(cache_key, data, REDIS_TTL)
    await _save_to_postgres(video_id, data)

    return response
