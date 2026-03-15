from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

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


@app.get("/")
async def root() -> dict:
    return {"status": "ok", "app": "SoundFree", "version": settings.app_version}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": settings.app_version}
