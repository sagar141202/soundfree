import asyncio
from dataclasses import dataclass

import httpx
from loguru import logger

MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2"
HEADERS = {
    "User-Agent": "SoundFree/1.0.0 (personal music app)",
    "Accept": "application/json",
}


@dataclass
class MBTrackResult:
    recording_id: str
    title: str
    artist: str
    artist_mbid: str | None
    album: str | None
    album_mbid: str | None
    year: int | None
    label: str | None


def _pick_best_release(releases: list[dict]) -> dict | None:
    """Prefer releases with a valid year over those without."""
    if not releases:
        return None
    # Prefer releases that have a date
    dated = [r for r in releases if r.get("date") and len(r.get("date", "")) >= 4]
    if dated:
        # Pick earliest dated release
        return min(dated, key=lambda r: r.get("date", "9999"))
    return releases[0]


async def lookup_track(artist: str, title: str) -> MBTrackResult | None:
    """
    Query MusicBrainz for a recording and return metadata including MBIDs.
    """
    query = f'recording:"{title}" AND artist:"{artist}"'
    params = {
        "query": query,
        "limit": 5,
        "fmt": "json",
    }

    logger.info(f"MusicBrainz lookup: {artist} — {title}")

    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=10.0) as client:
            await asyncio.sleep(1.0)
            resp = await client.get(f"{MUSICBRAINZ_BASE}/recording", params=params)
            resp.raise_for_status()
            data = resp.json()

        recordings = data.get("recordings", [])
        if not recordings:
            logger.warning(f"No MusicBrainz results for: {artist} — {title}")
            return None

        rec = recordings[0]
        recording_id = rec.get("id", "")
        rec_title = rec.get("title", title)

        # Artist
        artist_credits = rec.get("artist-credit", [])
        artist_name = artist
        artist_mbid = None
        if artist_credits:
            ac = artist_credits[0]
            artist_name = ac.get("artist", {}).get("name", artist)
            artist_mbid = ac.get("artist", {}).get("id")

        # Release
        releases = rec.get("releases", [])
        release = _pick_best_release(releases)

        album = None
        album_mbid = None
        year = None
        label = None

        if release:
            album = release.get("title")
            album_mbid = release.get("id")
            date_str = release.get("date", "")
            if date_str and len(date_str) >= 4:
                try:
                    year = int(date_str[:4])
                except ValueError:
                    pass

        logger.info(f"MusicBrainz found: {rec_title} | album: {album} | year: {year}")

        return MBTrackResult(
            recording_id=recording_id,
            title=rec_title,
            artist=artist_name,
            artist_mbid=artist_mbid,
            album=album,
            album_mbid=album_mbid,
            year=year,
            label=label,
        )

    except httpx.HTTPError as e:
        logger.error(f"MusicBrainz HTTP error: {e}")
        return None
    except Exception as e:
        logger.error(f"MusicBrainz lookup error: {e}")
        return None
