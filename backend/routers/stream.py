import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from loguru import logger

from cache import cache_get, cache_set
from services.stream_service import get_stream_url as fetch_stream_url

router = APIRouter()

STREAM_CACHE_TTL = 60 * 60 * 5  # 5 hours


async def get_stream_url(video_id: str) -> dict | None:
    cache_key = f"stream:{video_id}"
    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Cache HIT for stream: {video_id}")
        return cached

    logger.info(f"Cache MISS for stream: {video_id} — fetching")
    result = await fetch_stream_url(video_id)
    if result:
        await cache_set(cache_key, result, STREAM_CACHE_TTL)
    return result


@router.get("/{video_id}")
async def stream(video_id: str) -> dict:
    result = await get_stream_url(video_id)
    if not result:
        raise HTTPException(status_code=404, detail="Stream not found")
    return result


@router.get("/{video_id}/proxy")
async def proxy_stream(video_id: str, request: Request):
    """Proxy audio through backend to avoid YouTube CDN blocking."""
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
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
        },
    )
