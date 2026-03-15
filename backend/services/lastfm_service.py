import httpx
from loguru import logger

LASTFM_BASE = "https://ws.audioscrobbler.com/2.0"


async def get_artist_image(artist: str, api_key: str) -> str | None:
    """Fetch artist image URL from Last.fm."""
    logger.info(f"Last.fm artist image lookup: {artist}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                LASTFM_BASE,
                params={
                    "method": "artist.getinfo",
                    "artist": artist,
                    "api_key": api_key,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        images = data.get("artist", {}).get("image", [])
        # Last.fm returns sizes: small, medium, large, extralarge, mega
        for size in ["extralarge", "mega", "large"]:
            for img in images:
                if img.get("size") == size and img.get("#text"):
                    logger.info(f"Last.fm image found for {artist}")
                    return img["#text"]

        return None

    except Exception as e:
        logger.error(f"Last.fm artist image error: {e}")
        return None


async def get_album_art(artist: str, album: str, api_key: str) -> str | None:
    """Fetch album art URL from Last.fm."""
    logger.info(f"Last.fm album art lookup: {artist} — {album}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                LASTFM_BASE,
                params={
                    "method": "album.getinfo",
                    "artist": artist,
                    "album": album,
                    "api_key": api_key,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        images = data.get("album", {}).get("image", [])
        for size in ["extralarge", "mega", "large"]:
            for img in images:
                if img.get("size") == size and img.get("#text"):
                    logger.info(f"Last.fm album art found for {artist} — {album}")
                    return img["#text"]

        return None

    except Exception as e:
        logger.error(f"Last.fm album art error: {e}")
        return None
