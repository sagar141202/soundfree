from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel

from cache import cache_get, cache_set
from config import settings
from services.coverart_service import get_cover_art
from services.lastfm_service import get_album_art, get_artist_image
from services.musicbrainz_service import lookup_track
from services.search_service import search_tracks

router = APIRouter()

METADATA_CACHE_TTL = 60 * 60 * 24 * 7  # 7 days


class MetadataResponse(BaseModel):
    video_id: str
    title: str
    artist: str
    album: str | None
    year: int | None
    cover_art_small: str | None
    cover_art_large: str | None
    artist_mbid: str | None
    album_mbid: str | None


@router.get("/{video_id}", response_model=MetadataResponse)
async def get_metadata(video_id: str) -> MetadataResponse:
    cache_key = f"metadata:{video_id}"

    # Check cache
    cached = await cache_get(cache_key)
    if cached:
        logger.info(f"Cache HIT for metadata: {video_id}")
        return MetadataResponse(**cached)

    logger.info(f"Cache MISS for metadata: {video_id} — fetching")

    # Step 1: Get title + artist from YouTube Music search by videoId
    title = "Unknown"
    artist = "Unknown"
    album = None

    search_results = await search_tracks(video_id, limit=1)
    if search_results:
        track = search_results[0]
        title = track.title
        artist = track.artist
        album = track.album

    # Step 2: MusicBrainz lookup for MBIDs + year
    mb_result = await lookup_track(artist, title)
    artist_mbid = mb_result.artist_mbid if mb_result else None
    album_mbid = mb_result.album_mbid if mb_result else None
    year = mb_result.year if mb_result else None
    if mb_result and mb_result.album:
        album = mb_result.album

    # Step 3: Cover art — CAA → Last.fm album → Last.fm artist → None
    cover_small = None
    cover_large = None

    if album_mbid:
        art = await get_cover_art(album_mbid)
        if art:
            cover_small = art.get("small")
            cover_large = art.get("large")

    if not cover_large and settings.lastfm_api_key:
        if album:
            lastfm_art = await get_album_art(artist, album, settings.lastfm_api_key)
            if lastfm_art:
                cover_small = lastfm_art
                cover_large = lastfm_art

    if not cover_large and settings.lastfm_api_key:
        artist_img = await get_artist_image(artist, settings.lastfm_api_key)
        if artist_img:
            cover_small = artist_img
            cover_large = artist_img

    response = MetadataResponse(
        video_id=video_id,
        title=title,
        artist=artist,
        album=album,
        year=year,
        cover_art_small=cover_small,
        cover_art_large=cover_large,
        artist_mbid=artist_mbid,
        album_mbid=album_mbid,
    )

    await cache_set(cache_key, response.model_dump(), METADATA_CACHE_TTL)
    logger.info(f"Metadata cached for {video_id}")

    return response
