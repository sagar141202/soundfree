import httpx
from loguru import logger

LRCLIB_BASE = "https://lrclib.net/api"


def _parse_lrc(lrc_text: str) -> list[dict]:
    """Parse .lrc format into [{time_ms, text}] array."""
    lines = []
    for line in lrc_text.strip().splitlines():
        line = line.strip()
        if not line or not line.startswith("["):
            continue
        try:
            # Format: [MM:SS.xx] or [MM:SS.xxx] text
            bracket_end = line.index("]")
            time_str = line[1:bracket_end]
            text = line[bracket_end + 1 :].strip()

            if ":" not in time_str:
                continue

            parts = time_str.split(":")
            minutes = int(parts[0])
            seconds = float(parts[1])
            time_ms = int((minutes * 60 + seconds) * 1000)

            if text:
                lines.append({"time_ms": time_ms, "text": text})
        except (ValueError, IndexError):
            continue

    return sorted(lines, key=lambda x: x["time_ms"])


async def get_lyrics_lrclib(
    artist: str,
    title: str,
    album: str | None = None,
    duration: int | None = None,
) -> dict | None:
    """
    Fetch synced lyrics from lrclib.net.
    Returns {'lines': [{time_ms, text}], 'synced': True} or
            {'lines': [{'time_ms': 0, 'text': plain_text}], 'synced': False}
    """
    logger.info(f"lrclib lookup: {artist} — {title}")

    params = {
        "artist_name": artist,
        "track_name": title,
    }
    if album:
        params["album_name"] = album
    if duration:
        params["duration"] = duration // 1000  # lrclib uses seconds

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"{LRCLIB_BASE}/get", params=params)

            if resp.status_code == 404:
                logger.warning(f"lrclib: no result for {artist} — {title}")
                return None

            resp.raise_for_status()
            data = resp.json()

        # Try synced lyrics first
        synced_lyrics = data.get("syncedLyrics")
        if synced_lyrics:
            lines = _parse_lrc(synced_lyrics)
            if lines:
                logger.info(f"lrclib: synced lyrics found ({len(lines)} lines)")
                return {"lines": lines, "synced": True, "source": "lrclib"}

        # Fallback to plain lyrics
        plain_lyrics = data.get("plainLyrics")
        if plain_lyrics:
            lines = [{"time_ms": 0, "text": plain_lyrics}]
            logger.info("lrclib: plain lyrics found")
            return {"lines": lines, "synced": False, "source": "lrclib"}

        return None

    except httpx.HTTPError as e:
        logger.error(f"lrclib HTTP error: {e}")
        return None
    except Exception as e:
        logger.error(f"lrclib error: {e}")
        return None


async def search_lyrics_lrclib(artist: str, title: str) -> dict | None:
    """Search lrclib when exact match fails."""
    logger.info(f"lrclib search: {artist} — {title}")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{LRCLIB_BASE}/search", params={"artist_name": artist, "track_name": title}
            )
            resp.raise_for_status()
            results = resp.json()

        if not results:
            return None

        # Pick best match
        best = results[0]
        synced = best.get("syncedLyrics")
        if synced:
            lines = _parse_lrc(synced)
            if lines:
                return {"lines": lines, "synced": True, "source": "lrclib"}

        plain = best.get("plainLyrics")
        if plain:
            return {"lines": [{"time_ms": 0, "text": plain}], "synced": False, "source": "lrclib"}

        return None

    except Exception as e:
        logger.error(f"lrclib search error: {e}")
        return None
