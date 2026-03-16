from datetime import UTC

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

scheduler = AsyncIOScheduler()


async def refresh_trending_cache():
    """Refresh trending tracks every 6 hours."""
    logger.info("Refreshing trending tracks cache...")
    try:
        from cache import cache_set
        from routers.trending import _fetch_trending

        tracks = await _fetch_trending()
        if tracks:
            await cache_set("trending:india", tracks, 60 * 60 * 6)
            logger.info(f"Trending cache refreshed: {len(tracks)} tracks")
    except Exception as e:
        logger.error(f"Trending refresh failed: {e}")


async def rebuild_recommendations():
    """Nightly job: rebuild index + cache recommendations in Redis."""
    logger.info("Nightly recommendation rebuild starting...")

    try:
        # 1. Rebuild similarity index
        from services.annoy_service import build_index

        result = await build_index()
        logger.info(f"Index rebuilt: {result}")

        # 2. Compute user vector
        from services.recommendation_service import compute_user_vector, get_recommendations

        vector = await compute_user_vector()
        if not vector:
            logger.warning("No user vector — skipping recommendation cache")
            return

        # 3. Get recommendations
        recs = await get_recommendations(limit=50)
        if not recs:
            logger.warning("No recommendations generated")
            return

        # 4. Cache in Redis (24 hours)
        from cache import cache_set

        await cache_set("recommendations:feed", recs, ttl=60 * 60 * 24)
        await cache_set("recommendations:vector", vector, ttl=60 * 60 * 24)
        logger.info(f"Cached {len(recs)} recommendations in Redis")

    except Exception as e:
        logger.error(f"Recommendation rebuild failed: {e}")


async def start_scheduler():
    """Start APScheduler with nightly rebuild job."""
    # Nightly at 2am
    scheduler.add_job(
        rebuild_recommendations,
        CronTrigger(hour=2, minute=0),
        id="nightly_rebuild",
        name="Nightly recommendation rebuild",
        replace_existing=True,
    )

    # Also run on startup after 30s delay to warm cache
    from datetime import datetime, timedelta

    from apscheduler.triggers.date import DateTrigger

    startup_time = datetime.now(UTC) + timedelta(seconds=30)
    scheduler.add_job(
        rebuild_recommendations,
        DateTrigger(run_date=startup_time),
        id="startup_rebuild",
        name="Startup recommendation warmup",
        replace_existing=True,
    )

    # Trending refresh every 6 hours
    scheduler.add_job(
        refresh_trending_cache,
        CronTrigger(hour="*/6", minute=0),
        id="trending_refresh",
        name="Trending tracks refresh",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started — nightly rebuild at 2:00 AM, warmup in 30s")
