import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta

from loguru import logger


@dataclass
class StreamResult:
    video_id: str
    stream_url: str
    format: str
    bitrate: int | None
    expires_at: datetime


async def get_stream_url(video_id: str) -> StreamResult | None:
    """
    Use yt-dlp as async subprocess to extract the best audio-only stream URL.
    Returns StreamResult or None if extraction fails.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    cmd = [
        "yt-dlp",
        "--format",
        "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio",
        "--get-url",
        "--get-format",
        "--no-warnings",
        "--quiet",
        url,
    ]

    logger.info(f"Extracting stream URL for video_id: {video_id}")

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30.0)

        if proc.returncode != 0:
            logger.error(f"yt-dlp failed for {video_id}: {stderr.decode().strip()}")
            return None

        lines = stdout.decode().strip().splitlines()
        if len(lines) < 2:
            logger.error(f"Unexpected yt-dlp output for {video_id}: {lines}")
            return None

        stream_url = lines[0].strip()
        fmt = lines[1].strip()

        # YouTube stream URLs expire in ~6 hours — we cache for 5
        expires_at = datetime.utcnow() + timedelta(hours=5)

        logger.info(f"Got stream URL for {video_id} | format: {fmt}")

        return StreamResult(
            video_id=video_id,
            stream_url=stream_url,
            format=fmt,
            bitrate=None,
            expires_at=expires_at,
        )

    except TimeoutError:
        logger.error(f"yt-dlp timed out for {video_id}")
        return None
    except Exception as e:
        logger.error(f"Stream extraction error for {video_id}: {e}")
        return None
