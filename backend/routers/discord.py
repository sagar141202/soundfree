from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class PresenceUpdate(BaseModel):
    title: str
    artist: str
    album: str | None = None
    position_ms: int = 0
    duration_ms: int = 0
    is_playing: bool = True


class DiscordConfig(BaseModel):
    client_id: str
    enabled: bool = True


@router.get("/status")
async def get_discord_status() -> dict:
    from services.discord_service import get_status

    return get_status()


@router.post("/config")
async def set_discord_config(config: DiscordConfig) -> dict:
    from services.discord_service import set_client_id, set_enabled

    set_client_id(config.client_id)
    set_enabled(config.enabled)
    return {"status": "ok", "client_id": config.client_id, "enabled": config.enabled}


@router.post("/update")
async def update_discord_presence(body: PresenceUpdate) -> dict:
    from services.discord_service import update_presence

    return await update_presence(
        title=body.title,
        artist=body.artist,
        album=body.album,
        position_ms=body.position_ms,
        duration_ms=body.duration_ms,
        is_playing=body.is_playing,
    )


@router.post("/clear")
async def clear_discord_presence() -> dict:
    from services.discord_service import clear_presence

    return await clear_presence()
