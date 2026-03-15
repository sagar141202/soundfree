import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from cache import cache_get, cache_set
from config import settings
from logger import setup_logging

setup_logging()

app = FastAPI(
    title="SoundFree API",
    version="1.0.0",
    description="Personal music streaming backend",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration_ms:.1f}ms)"
    )
    return response


@app.get("/")
async def root() -> dict:
    return {"status": "ok", "app": "SoundFree", "version": settings.app_version}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": settings.app_version}


@app.get("/test-redis")
async def test_redis() -> dict:
    await cache_set("test_key", {"hello": "soundfree"}, ttl_seconds=60)
    value = await cache_get("test_key")
    return {"cached": value}
