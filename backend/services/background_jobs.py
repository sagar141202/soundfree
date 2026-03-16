import asyncio

from loguru import logger

_queue: asyncio.Queue = asyncio.Queue()
_worker_running = False


async def _worker():
    """Background worker that processes feature extraction jobs."""
    global _worker_running
    _worker_running = True
    logger.info("Background job worker started")

    while True:
        try:
            job = await asyncio.wait_for(_queue.get(), timeout=30.0)
            job_type = job.get("type")

            if job_type == "extract_features":
                video_id = job["video_id"]
                await _run_feature_extraction(video_id)

            _queue.task_done()

        except TimeoutError:
            continue
        except Exception as e:
            logger.error(f"Background job error: {e}")


async def _run_feature_extraction(video_id: str):
    """Extract features for a video_id if audio is cached."""
    from pathlib import Path

    from services.audio_analysis_service import analyze_and_store

    # Check if audio file exists
    download_dir = Path("/tmp/soundfree_downloads")
    audio_path = None

    for ext in ["opus", "webm", "m4a", "mp3"]:
        path = download_dir / f"{video_id}.{ext}"
        if path.exists() and path.stat().st_size > 0:
            audio_path = str(path)
            break

    if not audio_path:
        logger.debug(f"No audio cached for {video_id} — skipping feature extraction")
        return

    # Check if features already extracted
    from database import AsyncSessionLocal
    from models import Track

    async with AsyncSessionLocal() as session:
        track = await session.get(Track, video_id)
        if track and track.bpm is not None:
            logger.debug(f"Features already exist for {video_id}")
            return

    logger.info(f"Extracting features for {video_id}")
    features = await analyze_and_store(video_id, audio_path)
    if features:
        logger.info(f"Features extracted for {video_id}: BPM={features['bpm']}")
    else:
        logger.warning(f"Feature extraction failed for {video_id}")


def enqueue_feature_extraction(video_id: str):
    """Add a feature extraction job to the queue."""
    try:
        _queue.put_nowait({"type": "extract_features", "video_id": video_id})
        logger.debug(f"Queued feature extraction for {video_id}")
    except asyncio.QueueFull:
        logger.warning(f"Job queue full — skipping {video_id}")


async def start_worker():
    """Start the background worker."""
    asyncio.create_task(_worker())
    logger.info("Background worker task created")
