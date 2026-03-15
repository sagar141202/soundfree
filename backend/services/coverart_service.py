import httpx
from loguru import logger

CAA_BASE = "https://coverartarchive.org"
HEADERS = {
    "User-Agent": "SoundFree/1.0.0 (personal music app)",
}


async def get_cover_art(album_mbid: str) -> dict | None:
    """
    Fetch cover art URLs from Cover Art Archive.
    Returns dict with 'small' (500px) and 'large' (1200px) URLs.
    """
    url = f"{CAA_BASE}/release/{album_mbid}"
    logger.info(f"Fetching cover art for album MBID: {album_mbid}")

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            timeout=10.0,
            follow_redirects=True,
        ) as client:
            resp = await client.get(url)

            if resp.status_code == 404:
                logger.warning(f"No cover art found for MBID: {album_mbid}")
                return None

            resp.raise_for_status()
            data = resp.json()

        images = data.get("images", [])
        if not images:
            return None

        # Prefer front cover
        front = next((img for img in images if img.get("front")), images[0])
        thumbnails = front.get("thumbnails", {})

        small = thumbnails.get("500") or thumbnails.get("small") or front.get("image")
        large = thumbnails.get("1200") or thumbnails.get("large") or front.get("image")

        logger.info(f"Cover art found for {album_mbid}")
        return {"small": small, "large": large}

    except httpx.HTTPError as e:
        logger.error(f"Cover Art Archive HTTP error: {e}")
        return None
    except Exception as e:
        logger.error(f"Cover art fetch error: {e}")
        return None


async def get_cover_art_by_release_mbid(album_mbid: str) -> str | None:
    """Convenience function — returns just the large cover art URL."""
    result = await get_cover_art(album_mbid)
    if result:
        return result.get("large") or result.get("small")
    return None
