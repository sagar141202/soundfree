import time

from loguru import logger

_rpc = None
_connected = False
_client_id = "1234567890"  # Default — user can override
_last_update = 0
_enabled = False


def set_client_id(client_id: str):
    global _client_id
    _client_id = client_id


def set_enabled(enabled: bool):
    global _enabled
    _enabled = enabled


async def _connect():
    global _rpc, _connected
    try:
        from pypresence import AioPresence

        _rpc = AioPresence(_client_id)
        await _rpc.connect()
        _connected = True
        logger.info(f"Discord RPC connected (client_id={_client_id})")
    except Exception as e:
        _connected = False
        logger.warning(f"Discord RPC connect failed: {e}")


async def _disconnect():
    global _rpc, _connected
    if _rpc and _connected:
        try:
            await _rpc.close()
        except Exception:
            pass
    _rpc = None
    _connected = False
    logger.info("Discord RPC disconnected")


async def update_presence(
    title: str,
    artist: str,
    album: str | None = None,
    position_ms: int = 0,
    duration_ms: int = 0,
    is_playing: bool = True,
) -> dict:
    global _last_update, _connected, _rpc

    if not _enabled:
        return {"status": "disabled"}

    # Rate limit — max 1 update per 15s
    now = time.time()
    if now - _last_update < 15:
        return {"status": "rate_limited"}
    _last_update = now

    if not _connected:
        await _connect()
        if not _connected:
            return {"status": "not_connected"}

    try:
        details = f"{title}"
        state = f"by {artist}"
        if album:
            state += f" · {album}"

        # Calculate end timestamp for progress bar
        end_time = None
        if is_playing and duration_ms > 0 and position_ms >= 0:
            remaining_ms = duration_ms - position_ms
            end_time = int(time.time() + remaining_ms / 1000)

        await _rpc.update(
            details=details[:128],
            state=state[:128],
            large_image="soundfree_logo",
            large_text="SoundFree — Self-hosted Music",
            small_image="playing" if is_playing else "paused",
            small_text="Playing" if is_playing else "Paused",
            end=end_time,
            buttons=[
                {"label": "🎵 SoundFree", "url": "https://github.com/sagar141202/soundfree"},
            ],
        )
        logger.info(f"Discord RPC updated: {title} by {artist}")
        return {"status": "updated", "title": title, "artist": artist}

    except Exception as e:
        logger.warning(f"Discord RPC update failed: {e}")
        _connected = False
        return {"status": "error", "detail": str(e)}


async def clear_presence() -> dict:
    global _connected, _rpc
    if not _connected or not _rpc:
        return {"status": "not_connected"}
    try:
        await _rpc.clear()
        logger.info("Discord RPC cleared")
        return {"status": "cleared"}
    except Exception as e:
        logger.warning(f"Discord RPC clear failed: {e}")
        return {"status": "error"}


def get_status() -> dict:
    return {
        "enabled": _enabled,
        "connected": _connected,
        "client_id": _client_id,
    }
