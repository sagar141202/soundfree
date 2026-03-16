import dataclasses
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select

from cache import cache_get, cache_set
from services.stream_service import get_stream_url as fetch_stream_url

router = APIRouter()

STREAM_CACHE_TTL = 60 * 60 * 5


def _to_dict(obj) -> dict:
    if dataclasses.is_dataclass(obj):
        result = {}
        for f in dataclasses.fields(obj):
            val = getattr(obj, f.name)
            if isinstance(val, datetime):
                result[f.name] = val.isoformat()
            else:
                result[f.name] = val
        return result
    return dict(obj)


async def get_stream_url(video_id: str) -> dict | None:
    cache_key = f"stream:{video_id}"
    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Cache HIT for stream: {video_id}")
        return cached
    logger.info(f"Cache MISS for stream: {video_id} — fetching")
    result = await fetch_stream_url(video_id)
    if result:
        result_dict = _to_dict(result)
        await cache_set(cache_key, result_dict, STREAM_CACHE_TTL)
        return result_dict
    return None


@router.get("/{video_id}")
async def stream(video_id: str) -> dict:
    result = await get_stream_url(video_id)
    if not result:
        raise HTTPException(status_code=404, detail="Stream not found")
    return result


@router.get("/{video_id}/proxy")
async def proxy_stream(video_id: str, request: Request):
    result = await get_stream_url(video_id)
    if not result:
        raise HTTPException(status_code=404, detail="Stream not found")
    url = result["stream_url"]
    range_header = request.headers.get("range", "bytes=0-")

    async def stream_audio():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "GET",
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
                    "Range": range_header,
                    "Referer": "https://www.youtube.com/",
                    "Origin": "https://www.youtube.com",
                },
            ) as resp:
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    yield chunk

    return StreamingResponse(
        stream_audio(),
        media_type="audio/webm",
        headers={"Accept-Ranges": "bytes", "Cache-Control": "no-cache"},
    )


class PlayedRequest(BaseModel):
    title: str | None = None
    artist: str | None = None
    album: str | None = None
    duration_ms: int | None = None
    thumbnail_url: str | None = None


@router.post("/{video_id}/played")
async def log_play(video_id: str, body: PlayedRequest = PlayedRequest()) -> dict:
    from database import AsyncSessionLocal
    from models import PlayHistory, Track
    from services.background_jobs import enqueue_feature_extraction

    try:
        async with AsyncSessionLocal() as session:
            # Use select instead of get to avoid cache issues
            result = await session.execute(select(Track).where(Track.video_id == video_id))
            track = result.scalar_one_or_none()

            # Insert if missing and we have metadata
            if not track and body.title:
                track = Track(
                    video_id=video_id,
                    title=body.title,
                    artist=body.artist or "Unknown",
                    album=body.album,
                    duration_ms=body.duration_ms,
                    thumbnail_url=body.thumbnail_url,
                )
                session.add(track)
                await session.flush()
                logger.info(f"Inserted track: {body.title}")

            if track:
                session.add(PlayHistory(video_id=video_id, user_id=None))
                await session.commit()
                logger.info(f"Logged play: {video_id}")

                if track.bpm is None:
                    enqueue_feature_extraction(video_id)

                return {"status": "logged"}

            return {"status": "skipped", "reason": "track not in db"}

    except Exception as e:
        logger.warning(f"Play log error: {e}")
        return {"status": "error", "detail": str(e)}
