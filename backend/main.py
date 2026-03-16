import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from limiter import limiter
from logger import setup_logging
from routers import download, likes, lyrics, metadata, recommendations, search, stream
from services.background_jobs import start_worker
from services.scheduler import start_scheduler

setup_logging()

app = FastAPI(
    title="SoundFree API",
    version="1.0.0",
    description="Personal music streaming backend",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(stream.router, prefix="/stream", tags=["stream"])
app.include_router(metadata.router, prefix="/metadata", tags=["metadata"])
app.include_router(lyrics.router, prefix="/lyrics", tags=["lyrics"])
app.include_router(likes.router, prefix="/likes", tags=["likes"])
app.include_router(download.router, prefix="/download", tags=["download"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])


@app.on_event("startup")
async def startup_event():
    await start_worker()
    await start_scheduler()
    logger.info("SoundFree API started")


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
