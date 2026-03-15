# SoundFree — Tech Stack Document

**Version:** 1.0.0
**Status:** Active
**Last Updated:** 2026-03-15

---

## 1. Architecture Overview

SoundFree uses a **client-server architecture** with a Python FastAPI backend acting as a smart proxy and intelligence layer, and a React Native (Expo) Android app as the frontend. Audio is never stored on the server — the backend fetches a direct YouTube CDN stream URL and hands it to the phone to play directly. This keeps server costs zero and latency minimal.

```
[Android App]  ←→  [FastAPI Backend]  ←→  [YouTube CDN]
                           ↕
               [PostgreSQL | Redis | ML Engine]
```

---

## 2. Backend

### 2.1 Runtime & Framework

| Package | Version | Purpose |
|---------|---------|---------|
| Python | 3.12 | Runtime |
| FastAPI | 0.115+ | Async HTTP API framework |
| Uvicorn | 0.30+ | ASGI server (with uvloop for speed) |
| Gunicorn | 22+ | Production process manager |
| Pydantic v2 | 2.7+ | Request/response validation, settings |

**Why FastAPI?** Async-native (perfect for I/O-bound tasks like URL fetching), auto-generates OpenAPI docs, Pydantic v2 is blazing fast, and Python gives access to the best ML/audio libraries.

### 2.2 Audio & Streaming

| Package | Version | Purpose |
|---------|---------|---------|
| yt-dlp | Latest | Extract YouTube audio stream URLs |
| ytmusicapi | 1.8+ | YouTube Music search (no API key needed) |
| librosa | 0.10+ | Audio feature extraction (BPM, key, energy) |
| soundfile | 0.12+ | Audio file I/O for librosa |

**How streaming works:**
1. Client calls `GET /stream/{video_id}`
2. Backend checks Redis cache for a valid (non-expired) stream URL
3. If miss: yt-dlp fetches the best audio-only format URL from YouTube
4. URL returned to client → client plays directly from YouTube CDN
5. URL cached in Redis for 5 hours (YouTube URLs expire at ~6 hours)

**yt-dlp format selection:**
```python
ydl_opts = {
    'format': 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio',
    'quiet': True,
    'no_warnings': True,
    'extract_flat': False,
}
```
This selects Opus/WebM (~160kbps) or AAC/M4A (~128kbps) — equivalent to Spotify HQ.

### 2.3 Lyrics

| Package | Purpose |
|---------|---------|
| httpx | Async HTTP client for lrclib.net API |
| lyricsgenius | Genius.com scraper (fallback, needs free API key) |
| syncedlyrics | Python library that queries multiple lyrics sources |

**Lyrics pipeline:**
1. Query `lrclib.net` (free, no key, 10M+ synced songs) → returns `.lrc` format
2. Parse `.lrc` into `[{time_ms: int, text: str}]` array
3. If not found: try `syncedlyrics` (queries multiple providers)
4. If still not found: try Genius (static, no timestamps)
5. Cache result in Postgres (avoid re-fetching for popular songs)

### 2.4 Metadata & Album Art

| Source | Used For |
|--------|----------|
| MusicBrainz API | Canonical metadata (MBID, release dates, labels) |
| Cover Art Archive | High-res album art (free, no key) |
| Last.fm API | Album art fallback + artist images (free API key) |
| YouTube thumbnail | Last resort (crop to square, upscale if needed) |

### 2.5 Database

**Primary database: PostgreSQL (Supabase free tier)**

```sql
-- Core tables
users              -- id, name, created_at (future multi-user support)
tracks             -- video_id, title, artist, album, duration, bpm, key, energy, lyrics_cached
play_history       -- user_id, video_id, played_at, duration_played, completed
playlists          -- id, user_id, name, created_at, cover_url
playlist_tracks    -- playlist_id, video_id, position, added_at
liked_tracks       -- user_id, video_id, liked_at
downloads          -- user_id, video_id, local_path, downloaded_at, file_size
artist_cache       -- mbid, name, bio, image_url, cached_at
album_cache        -- mbid, title, artist_mbid, year, cover_url, cached_at
lyrics_cache       -- video_id, lyrics_json, source, synced, cached_at
```

**SQLAlchemy ORM setup:**
```python
# async ORM — essential for FastAPI
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
engine = create_async_engine("postgresql+asyncpg://...")
```

**Cache layer: Redis (Upstash free tier)**

```
Keys and TTLs:
stream:{video_id}           → stream URL JSON      TTL: 5h
search:{query_hash}         → search results JSON  TTL: 30min
lyrics:{video_id}           → lyrics array JSON    TTL: 7 days (permanent cache in Postgres too)
art:{mbid}                  → cover art URL        TTL: 24h
recommendations:{user_id}   → track list JSON      TTL: 12h (regenerated nightly)
```

### 2.6 Recommendation Engine

| Package | Purpose |
|---------|---------|
| scikit-learn | Collaborative filtering, cosine similarity |
| annoy | Approximate nearest neighbor search (fast at query time) |
| numpy | Vector math |
| pandas | Data manipulation for training |
| librosa | Audio feature extraction (BPM, spectral centroid, MFCC) |

**How recommendations work:**

**Step 1: Feature extraction (runs when a track is first played)**
```python
features = {
    'bpm': librosa.beat.tempo(y, sr),
    'key': librosa.key_to_notes(librosa.estimate_tuning(y)),
    'energy': float(np.mean(librosa.feature.rms(y))),
    'valence': compute_valence(y, sr),      # happy vs sad proxy
    'danceability': compute_danceability(y, sr),
    'spectral_centroid': np.mean(librosa.feature.spectral_centroid(y, sr)),
}
```

**Step 2: User vector (built nightly)**
- Weighted average of feature vectors for all played tracks
- Higher weight for: completed tracks, repeated plays, liked tracks
- Lower weight for: skipped in first 30 seconds

**Step 3: ANN search (at recommendation request time)**
- Build Annoy index from all tracks in play_history + popular tracks DB
- Query with user vector → return top 50 nearest neighbours
- Filter out recently played (< 7 days) and already-liked tracks
- Return top 20 as recommendations

### 2.7 API Routers

```
GET  /search?q={query}&limit=20         Search tracks, artists, albums
GET  /stream/{video_id}                 Get stream URL (cached via Redis)
GET  /lyrics/{video_id}                 Get synced lyrics
GET  /metadata/{video_id}               Get track metadata + album art URL
GET  /recommendations?limit=20          Get personalized recommendations
POST /history                           Log a play event
POST /like/{video_id}                   Like/unlike a track
GET  /playlist                          List user playlists
POST /playlist                          Create playlist
PUT  /playlist/{id}                     Update playlist
GET  /playlist/{id}/tracks              Get playlist tracks
POST /playlist/{id}/tracks              Add track to playlist
DELETE /playlist/{id}/tracks/{video_id} Remove track from playlist
GET  /download/{video_id}               Get downloadable audio file URL
GET  /artist/{mbid}                     Get artist info + top tracks
GET  /album/{mbid}                      Get album info + tracklist
WS   /ws/collab/{room_id}               WebSocket for collaborative listening
```

### 2.8 Background Jobs

```python
# Runs via asyncio background tasks + APScheduler
JOB: refresh_stream_cache       # Every 4.5h — pre-warm URLs for recently played
JOB: build_recommendations      # Every night at 2am — rebuild Annoy index
JOB: extract_audio_features     # On new track play — async background task
JOB: cleanup_old_history        # Weekly — archive plays older than 1 year
JOB: update_trending            # Every 6h — scrape YouTube Music trending
```

### 2.9 Authentication

For V1 (personal use only): **no authentication**. Backend runs on LAN or behind Cloudflare Tunnel. Access is implicitly secured by network access.

For V2 (if sharing with family): JWT tokens via `python-jose`, bcrypt password hashing via `passlib`.

---

## 3. Frontend (Android)

### 3.1 Framework & Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| React Native | 0.74+ | Cross-platform mobile framework |
| Expo SDK | 51+ | Managed workflow, OTA updates, device APIs |
| Expo Router | 3+ | File-based navigation |
| TypeScript | 5+ | Type safety |

**Why Expo over bare React Native?**
- OTA updates (fix bugs without App Store/Play Store submission)
- `expo-av` for audio with zero native config
- `expo-file-system` for offline downloads
- Built-in EAS Build for generating APK

### 3.2 Audio Engine

| Package | Purpose |
|---------|---------|
| react-native-track-player | Background playback, lock screen controls, media session |
| expo-av | Audio playback engine (crossfade, speed, pitch) |

**react-native-track-player** is the backbone for:
- Lock screen controls (Android media session)
- Notification player
- Earphone button support (play/pause/skip)
- Queue management
- Background audio continuation

**Crossfade implementation:**
```javascript
// Start next track at volume 0, 3 seconds before current track ends
// Fade current track from 1.0 → 0 over 3 seconds
// Fade next track from 0 → 1.0 over 3 seconds
```

### 3.3 State Management

| Package | Purpose |
|---------|---------|
| Zustand | Global app state (player, queue, user) |
| @tanstack/react-query | Server state, caching, background refresh |
| React Context | Theme, auth |

**Zustand stores:**
```typescript
usePlayerStore     // currentTrack, isPlaying, position, duration, queue
useLibraryStore    // likedTracks, playlists, downloads
useUIStore         // theme, accentColor, activeTab
useSettingsStore   // EQ settings, crossfade duration, sleep timer
```

**React Query usage:**
- `useSearch(query)` — debounced search with 5-minute cache
- `useRecommendations()` — 12-hour cache, background refresh
- `useTrackMetadata(videoId)` — permanent cache (metadata doesn't change)
- `useLyrics(videoId)` — permanent cache, fetched at track start

### 3.4 UI Libraries

| Package | Purpose |
|---------|---------|
| NativeWind v4 | Tailwind CSS for React Native |
| react-native-reanimated | High-performance animations (runs on UI thread) |
| react-native-gesture-handler | Swipe gestures, drag-to-reorder |
| @shopify/flash-list | Performant virtualized lists (replaces FlatList) |
| react-native-blur | BlurView for glass effect backgrounds |
| react-native-palette | Extract dominant colors from album art |
| react-native-svg | SVG rendering for custom waveform visualizer |
| expo-linear-gradient | Gradient overlays |

### 3.5 Storage (On-Device)

| Package | Purpose |
|---------|---------|
| expo-file-system | Download and store audio files |
| expo-sqlite | Local SQLite for offline track metadata |
| async-storage | Persist settings, cached data |
| expo-secure-store | Store any sensitive tokens securely |

**Offline storage structure:**
```
/storage/soundfree/
  /audio/
    {video_id}.webm       ← downloaded audio file
    {video_id}.m4a        ← fallback format
  /art/
    {video_id}_thumb.jpg  ← album art cached locally
  soundfree.db            ← SQLite: offline metadata
```

### 3.6 Networking

```typescript
// API client: axios with interceptors
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Interceptor: attach device ID (no auth for V1)
api.interceptors.request.use(config => {
  config.headers['X-Device-ID'] = deviceId;
  return config;
});

// Interceptor: handle offline gracefully
api.interceptors.response.use(null, error => {
  if (!error.response) offlineHandler();
  throw error;
});
```

### 3.7 Notifications & Background

| Package | Purpose |
|---------|---------|
| expo-notifications | Push notifications (future: new releases alert) |
| expo-background-fetch | Background sync for recommendations |
| expo-task-manager | Register background audio task |

---

## 4. Infrastructure

### 4.1 Environments

| Environment | Purpose | Hosting |
|-------------|---------|---------|
| Development | Local dev | `uvicorn --reload` on localhost |
| Staging | Test on real Android | Backend on Railway free tier |
| Production | Daily use | Self-hosted on home PC OR Railway |

### 4.2 Self-Hosted Option (Recommended)

**If you have an always-on PC or laptop at home:**

```bash
# Install Docker + Docker Compose
# Run:
docker-compose up -d

# Expose publicly via Cloudflare Tunnel (free):
cloudflared tunnel --url http://localhost:8000
# → gives you https://random-name.cfargotunnel.com
# → set this as EXPO_PUBLIC_API_URL in your .env
```

This is zero-cost, zero-latency (home network when on Wi-Fi), and has no sleeping/cold-start issues.

### 4.3 Docker Compose (Full Stack)

```yaml
version: '3.9'
services:
  api:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [postgres, redis]
    volumes:
      - ./audio_cache:/app/audio_cache

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: soundfree
      POSTGRES_USER: soundfree
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  pgdata:
```

### 4.4 Cloud Option (Free Tier)

| Service | Free Tier |
|---------|-----------|
| Railway | $5/month credit (free for light usage) |
| Render | 512MB RAM, sleeps after 15min inactivity |
| Supabase | PostgreSQL: 500MB storage, unlimited rows |
| Upstash | Redis: 10,000 requests/day free |

**Solve Render sleep problem:** Use UptimeRobot (free) to ping `/health` every 5 minutes.

### 4.5 Environment Variables

```bash
# Backend .env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/soundfree
REDIS_URL=redis://localhost:6379
LASTFM_API_KEY=your_lastfm_key
GENIUS_ACCESS_TOKEN=your_genius_token
SECRET_KEY=your_secret_key_for_jwt

# Frontend .env
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## 5. Dev Tooling

### 5.1 Backend (Python)

| Tool | Config | Purpose |
|------|--------|---------|
| Ruff | `ruff.toml` | Linter + formatter (replaces flake8 + black + isort) |
| mypy | `mypy.ini` | Static type checking |
| pytest | `pytest.ini` | Unit + integration tests |
| pytest-asyncio | — | Async test support |
| httpx | — | HTTP client for testing API endpoints |
| pre-commit | `.pre-commit-config.yaml` | Run ruff + mypy before every commit |

### 5.2 Frontend (TypeScript/React Native)

| Tool | Config | Purpose |
|------|--------|---------|
| ESLint | `.eslintrc.js` | Linting |
| Prettier | `.prettierrc` | Formatting |
| TypeScript | `tsconfig.json` | Type checking |
| Husky | `.husky/` | Pre-commit hooks |
| commitlint | `commitlint.config.js` | Enforce conventional commits |

**Commit convention:**
```
feat: add crossfade between tracks
fix: lyrics not scrolling on slow connection
chore: update yt-dlp to latest
docs: update README with setup steps
```

---

## 6. Testing Strategy

### 6.1 Backend Tests

```
tests/
  unit/
    test_ytdlp_service.py     → mock yt-dlp, test URL extraction
    test_lyrics_parser.py     → test LRC format parsing
    test_recommender.py       → test feature extraction + ANN search
    test_cache.py             → test Redis cache hit/miss logic
  integration/
    test_search_endpoint.py   → full search flow with test DB
    test_stream_endpoint.py   → stream URL caching + refresh
    test_history.py           → play history write + read
  e2e/
    test_full_play_flow.py    → search → stream → log history → recommend
```

**Coverage target:** 70%+ on core services (yt-dlp service, lyrics service, recommender)

### 6.2 Frontend Tests

```
__tests__/
  components/
    Player.test.tsx           → playback state rendering
    LyricsView.test.tsx       → sync line highlighting
  stores/
    playerStore.test.ts       → queue operations
  hooks/
    useSearch.test.ts         → debounce, cache, error states
```

**E2E (Detox):** Test the critical user flow: search → tap track → audio starts playing.

---

## 7. CI/CD

### 7.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  backend-ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r backend/requirements-dev.txt
      - run: ruff check backend/
      - run: mypy backend/
      - run: pytest backend/tests/ --cov=backend

  frontend-ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd mobile && npm ci
      - run: cd mobile && npx eslint .
      - run: cd mobile && npx tsc --noEmit
      - run: cd mobile && npm test -- --watchAll=false
```

### 7.2 Deployment

**Backend:** Push to `main` → GitHub Actions builds Docker image → deploys to Railway/Render (or triggers webhook to pull new image on self-hosted server).

**Android APK:** Use Expo EAS Build:
```bash
eas build -p android --profile preview   # APK for direct install
eas build -p android --profile production # AAB for Play Store (optional)
```

After build: download APK → install directly on Android via USB or link.

---

## 8. Security

| Concern | Mitigation |
|---------|------------|
| Backend exposed publicly | Cloudflare Tunnel encrypts all traffic, hides origin IP |
| yt-dlp abuse | Rate limit: 10 stream requests/minute per device |
| SQL injection | SQLAlchemy ORM parameterized queries (no raw SQL) |
| Dependency vulnerabilities | Dependabot alerts enabled on GitHub |
| Secrets in code | `.env` files, never committed (`.gitignore`) |
| API rate limits | Redis-based rate limiter middleware on all endpoints |

---

## 9. Monitoring

| Tool | Free Tier | Purpose |
|------|-----------|---------|
| Sentry | 5k errors/month | Error tracking + performance traces |
| UptimeRobot | 50 monitors | Uptime check + alerts |
| Railway metrics | Built-in | CPU, RAM, network usage |
| FastAPI `/metrics` | Custom endpoint | Request counts, latency percentiles |
| `/health` endpoint | Always returns 200 + version | Load balancer + uptime ping |

**Health check endpoint:**
```python
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "uptime_seconds": get_uptime()}
```

---

## 10. Performance Targets

| Operation | Target | Strategy |
|-----------|--------|----------|
| Stream URL response | < 1.5s | Redis cache, async yt-dlp |
| Search response | < 800ms | ytmusicapi is fast, cache popular queries |
| Lyrics response | < 500ms | Cache in Postgres after first fetch |
| Album art | < 300ms | CDN URL, cached by image component |
| App cold start | < 2s | Lazy load non-critical screens |
| Recommendation generation | < 5s (background) | Nightly pre-computation |
| Offline playback | instant | Pre-downloaded to device storage |

---

## 11. Future Roadmap (Not in V1)

- [ ] iOS support (same Expo codebase, minor changes)
- [ ] Web player (React + same FastAPI backend)
- [ ] Podcast support (RSS + yt-dlp for YouTube podcasts)
- [ ] Android Auto integration
- [ ] Wear OS companion app
- [ ] Desktop app (Electron wrapper around web player)
- [ ] Voice control ("Play something chill")
- [ ] Multi-user support (family accounts)
- [ ] Import Spotify playlists (via Exportify CSV → search + match)
