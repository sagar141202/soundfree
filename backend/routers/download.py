import asyncio
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from loguru import logger

router = APIRouter()

DOWNLOAD_DIR = Path("/tmp/soundfree_downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)


def _get_cached_path(video_id: str) -> Path | None:
    """Check if audio file already downloaded."""
    for ext in ["opus", "webm", "m4a", "mp3"]:
        path = DOWNLOAD_DIR / f"{video_id}.{ext}"
        if path.exists() and path.stat().st_size > 0:
            return path
    return None


async def _download_audio(video_id: str) -> Path:
    """Download audio using yt-dlp."""
    output_template = str(DOWNLOAD_DIR / f"{video_id}.%(ext)s")
    url = f"https://www.youtube.com/watch?v={video_id}"

    cmd = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format",
        "opus",
        "--audio-quality",
        "5",
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        "-o",
        output_template,
        url,
    ]

    logger.info(f"Downloading audio: {video_id}")
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)

    if proc.returncode != 0:
        logger.error(f"yt-dlp failed: {stderr.decode()}")
        raise HTTPException(status_code=500, detail="Download failed")

    # Find the downloaded file
    cached = _get_cached_path(video_id)
    if not cached:
        raise HTTPException(status_code=500, detail="Downloaded file not found")

    logger.info(f"Downloaded: {cached} ({cached.stat().st_size // 1024}KB)")
    return cached


@router.get("/{video_id}/info")
async def download_info(video_id: str) -> dict:
    """Check if audio is cached and get file size."""
    cached = _get_cached_path(video_id)
    if cached:
        return {
            "video_id": video_id,
            "cached": True,
            "size_bytes": cached.stat().st_size,
            "filename": cached.name,
        }
    return {"video_id": video_id, "cached": False}


@router.get("/{video_id}")
async def download_audio(video_id: str) -> FileResponse:
    """Download audio file — serves cached or downloads fresh."""
    # Check cache first
    cached = _get_cached_path(video_id)

    if not cached:
        cached = await _download_audio(video_id)

    return FileResponse(
        path=str(cached),
        media_type="audio/opus",
        filename=f"{video_id}.opus",
        headers={
            "Content-Disposition": f'attachment; filename="{video_id}.opus"',
            "Cache-Control": "public, max-age=86400",
        },
    )


@router.delete("/{video_id}")
async def delete_download(video_id: str) -> dict:
    """Delete cached download."""
    cached = _get_cached_path(video_id)
    if cached and cached.exists():
        cached.unlink()
        logger.info(f"Deleted download: {video_id}")
        return {"status": "deleted"}
    return {"status": "not_found"}


@router.get("/")
async def list_downloads() -> list:
    """List all cached downloads."""
    files = []
    for f in DOWNLOAD_DIR.iterdir():
        if f.is_file() and f.suffix in [".opus", ".webm", ".m4a", ".mp3"]:
            video_id = f.stem
            files.append(
                {
                    "video_id": video_id,
                    "filename": f.name,
                    "size_bytes": f.stat().st_size,
                    "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
                }
            )
    return sorted(files, key=lambda x: x["size_bytes"], reverse=True)
