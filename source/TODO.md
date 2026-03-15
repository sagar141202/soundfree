# SoundFree — Master TODO

**Generated:** 2026-03-15
**Method:** Analyzed PRD + DESIGN + TECHSTACK → prioritized by dependency order
**Convention:** Complete tasks in order within each phase. Later phases may depend on earlier ones.

---

## Legend

```
Status:  [ ] = todo   [x] = done   [-] = in progress   [~] = blocked
Effort:  XS = <2h  S = 2-4h  M = 4-8h  L = 1-2d  XL = 2-3d
```

---

## Phase 0 — Project Skeleton (Day 1)

> Get the repo structure in place before writing a single line of logic.

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-000 | Create GitHub repo `soundfree` | XS | Repo exists, `main` branch, MIT LICENSE, .gitignore for Python + Node |
| T-001 | Create monorepo folder structure | XS | `backend/` `mobile/` `docs/` `source/` `docker/` exist |
| T-002 | Commit `source/PRD.md` | XS | File committed, no placeholder text |
| T-003 | Commit `source/DESIGN.md` | XS | File committed, all sections filled |
| T-004 | Commit `source/TECHSTACK.md` | XS | File committed, all sections filled |
| T-005 | Commit `source/TODO.md` (this file) | XS | File committed |
| T-006 | Create `backend/requirements.txt` with all packages | XS | All packages from TECHSTACK listed with pinned versions |
| T-007 | Create `mobile/package.json` with all Expo dependencies | XS | All packages listed, `npm install` completes without errors |
| T-008 | Setup `.github/workflows/ci.yml` (basic lint + test) | S | CI runs on every push, lint passes |
| T-009 | Create `docker-compose.yml` for local dev | S | `docker-compose up` starts Postgres + Redis successfully |
| T-010 | Setup `pre-commit` hooks (ruff + eslint) | S | Running `git commit` triggers linting |

---

## Phase 1 — Backend Core (Week 1)

> Get a FastAPI server running that can search YouTube and return a playable stream URL.

### 1A — Project Setup

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-011 | Initialize FastAPI app with Uvicorn | XS | `uvicorn main:app --reload` runs, `/` returns `{"status": "ok"}` |
| T-012 | Setup Pydantic settings (`.env` loading) | S | All env vars load from `.env`, error thrown if required vars missing |
| T-013 | Create SQLAlchemy async engine + session | M | Can connect to local Postgres, no errors |
| T-014 | Create all database models (see TECHSTACK §2.5) | M | All tables created via `alembic upgrade head` |
| T-015 | Setup Alembic migrations | S | `alembic init`, initial migration file created and applied |
| T-016 | Setup Redis client (`redis.asyncio`) | S | Can `SET` and `GET` a test key from FastAPI endpoint |
| T-017 | Add structured logging (loguru) | S | Every request logs method, path, status, duration |
| T-018 | Add `/health` endpoint | XS | Returns `{"status": "ok", "version": "1.0.0"}` — passes uptime ping |
| T-019 | Add rate limiting middleware | M | Requests from same IP > 60/min get 429 response |

### 1B — Search

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-020 | Implement `ytmusicapi` search service | M | `search("bohemian rhapsody")` returns list of tracks with videoId, title, artist, duration, thumbnail |
| T-021 | Create `GET /search?q={query}` endpoint | S | Returns `[{video_id, title, artist, album, duration_ms, thumbnail_url}]` within 1s |
| T-022 | Add Redis cache for search results (30min TTL) | M | Same query within 30min hits cache, not ytmusicapi |
| T-023 | Test: search endpoint returns correct first result | S | "Bohemian Rhapsody Queen" → first result is the correct song |

### 1C — Streaming

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-024 | Implement yt-dlp service (async subprocess) | M | Given a YouTube videoId, returns the best audio stream URL + format + expiry |
| T-025 | Create `GET /stream/{video_id}` endpoint | S | Returns `{stream_url, format, expires_at}` within 1.5s |
| T-026 | Add Redis cache for stream URLs (5h TTL) | M | Second call for same videoId returns cached URL, sub-100ms response |
| T-027 | Handle yt-dlp errors gracefully | S | If yt-dlp fails (deleted video, geo-block), returns `{error: "stream_unavailable"}` with 422 |
| T-028 | Test: stream URL is actually playable | S | `ffprobe {stream_url}` confirms valid audio stream |

### 1D — Metadata & Art

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-029 | Implement MusicBrainz lookup service | L | Given artist + title, returns MBID, album MBID, year, label |
| T-030 | Implement Cover Art Archive service | M | Given album MBID, returns 500px and 1200px cover art URL |
| T-031 | Implement Last.fm fallback for cover art | M | If MusicBrainz has no art, Last.fm returns artist image |
| T-032 | Create `GET /metadata/{video_id}` endpoint | M | Returns complete metadata including cover art URL within 800ms |
| T-033 | Cache metadata in Postgres `tracks` table | M | Second request for same videoId queries Postgres, not external APIs |

---

## Phase 2 — Mobile App Core (Week 2)

> Get the Android app searching, displaying results, and playing a track.

### 2A — Expo Project Setup

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-034 | Initialize Expo project with TypeScript template | XS | `npx expo start` runs, blank app appears on phone via Expo Go |
| T-035 | Setup Expo Router (file-based navigation) | S | 4 tab screens exist: `(tabs)/index.tsx`, `search.tsx`, `library.tsx`, `profile.tsx` |
| T-036 | Setup NativeWind v4 | S | Tailwind classes apply correctly on a test component |
| T-037 | Setup Zustand stores (player, library, UI, settings) | M | Stores created with TypeScript types, persist via AsyncStorage |
| T-038 | Setup React Query with API client | M | `useQuery` fetches from backend URL in `.env`, handles offline error state |
| T-039 | Setup react-native-track-player | L | Audio plays in background, notification controls appear on Android |
| T-040 | Configure EAS Build for APK output | M | `eas build -p android --profile preview` completes successfully |

### 2B — Search Screen

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-041 | Build SearchBar component | S | Text input with search icon, clears on X tap, debounced 300ms |
| T-042 | Build TrackListItem component | M | Shows thumbnail (48×48, rounded), title, artist, duration, 3-dot menu icon |
| T-043 | Build SearchResultsList component | M | FlashList renders 20 results smoothly (no jank), skeleton loading state |
| T-044 | Connect search to backend API | M | Typing in search bar fetches from `/search`, results display in < 500ms |
| T-045 | Build BrowseCategories grid | M | 2-column grid of category cards shown when no search is active |
| T-046 | Handle empty state (no results) | S | Shows friendly message + suggestion when query returns 0 results |

### 2C — Now Playing (Basic)

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-047 | Build MiniPlayer component | L | Persistent bar above tabs: art + title + artist + play/pause + next button |
| T-048 | Implement play action (tap track → start stream) | L | Tapping a search result fetches stream URL → TrackPlayer starts → audio plays within 3s |
| T-049 | Build FullPlayer screen (basic) | XL | Full-screen: album art (300×300), title, artist, progress bar, controls |
| T-050 | Implement animated background (blurred album art) | L | Full player background is blurred album art, cross-fades on track change |
| T-051 | Wire progress bar to TrackPlayer position | M | Scrubbing slider seeks audio, elapsed/remaining time update every second |
| T-052 | Implement play/pause/skip/previous | M | All 4 controls work correctly, update UI state immediately |
| T-053 | Lock screen + notification controls | M | Android lock screen shows album art, track name, play/pause/skip buttons |
| T-054 | Earphone button support | S | Play/pause on single press, next on double press (media key) |

---

## Phase 3 — Lyrics & Album Art (Week 3)

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-055 | Implement lrclib.net service (backend) | M | Given artist + title, returns parsed `[{time_ms, text}]` array |
| T-056 | Implement Genius fallback scraper (backend) | M | If lrclib returns no result, Genius returns static lyrics |
| T-057 | Create `GET /lyrics/{video_id}` endpoint | S | Returns lyrics array + `synced: true/false` flag within 500ms |
| T-058 | Cache lyrics in Postgres `lyrics_cache` table | M | Second request hits cache, external API not called |
| T-059 | Build LyricsView component (mobile) | XL | Scrolling list of lyric lines; current line highlighted in accent color, scaled up 1.04×, smooth spring scroll |
| T-060 | Sync lyrics to TrackPlayer position | L | Correct line highlighted within ±0.5s of audio at all times |
| T-061 | Toggle lyrics overlay in FullPlayer | M | "Lyrics" button in full player shows/hides lyrics overlay with slide-up animation |
| T-062 | Show "Lyrics unavailable" state gracefully | S | If no lyrics found, show message instead of empty space |
| T-063 | Implement dynamic accent color from album art | L | Palette API extracts dominant color from album art → applies to progress bar, play button, lyrics highlight |
| T-064 | High-res album art: load full-res after thumbnail | M | Thumbnail shown instantly, then cross-faded to full-res when loaded (no layout shift) |

---

## Phase 4 — Library & Offline (Week 4–5)

### 4A — Library Features

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-065 | Implement play history logging (backend + mobile) | M | Every completed play (> 30s) logged to `play_history` table with timestamp |
| T-066 | Like/unlike track | M | Heart button in full player + track list; `POST /like/{video_id}` stores in DB; persists across app restarts |
| T-067 | Build Library screen | L | Shows: Liked Songs card, Downloaded card, Playlists list, Recently Played list |
| T-068 | Build Liked Songs playlist page | M | Full list of liked tracks sorted by most recently liked, playable |
| T-069 | Build Recently Played list | M | Last 50 plays with timestamps shown in Library |
| T-070 | Create / edit / delete playlists | L | User can name playlist, add cover photo (optional), save; appears in Library |
| T-071 | Add track to playlist | M | Long-press track → "Add to playlist" → sheet shows playlist list → track added |
| T-072 | Reorder tracks within playlist | M | Drag handles in playlist edit mode, order persisted to backend |
| T-073 | Build Artist page | L | Artist photo header, top 5 tracks, albums grid, related artists |
| T-074 | Build Album page | M | Album art header, tracklist, total duration, year |

### 4B — Offline Mode

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-075 | Add `GET /download/{video_id}` backend endpoint | M | Uses yt-dlp `--extract-audio` to produce a downloadable audio file URL (or serves the file directly) |
| T-076 | Implement download manager (mobile) | XL | Tap download → progress bar → file saved to `/storage/soundfree/audio/{video_id}.webm` |
| T-077 | Save track metadata to SQLite on download | M | Title, artist, album, duration, art URL saved to local DB; available offline |
| T-078 | Cache album art locally on download | M | Art image saved to device, served from local path when offline |
| T-079 | Play offline track without internet | L | If device has no internet and track is downloaded, plays from local file — no errors |
| T-080 | Build Downloaded tracks screen | M | List of all downloaded tracks with file size, option to delete individual downloads |
| T-081 | Show "Downloaded" badge on track list items | S | Small download icon on tracks that are saved locally |
| T-082 | Detect network state + show offline banner | M | If no internet, bottom snackbar "Playing from offline library" — online tracks greyed out |

---

## Phase 5 — Home Screen & Recommendations (Week 6–7)

### 5A — Recommendation Engine

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-083 | Implement audio feature extraction with librosa | L | For any downloaded/cached audio, extracts BPM, key, energy, spectral centroid |
| T-084 | Build feature extraction background job | M | Runs async after play_history logged; features saved to `tracks` table |
| T-085 | Build user vector computation | L | Weighted average of features for last 100 plays; recent plays weighted higher |
| T-086 | Build Annoy index from track features | M | Index built from all tracks with extracted features; serialized to disk |
| T-087 | Implement `GET /recommendations` endpoint | L | Returns 20 tracks similar to user vector; filters out recently played |
| T-088 | Add nightly recommendation rebuild job (APScheduler) | M | Job runs at 2am; rebuilds Annoy index + regenerates recommendations; cached in Redis |
| T-089 | Test recommendation quality | M | After 20+ play history entries, recommendations feel related to actual taste |

### 5B — Home Screen

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-090 | Build Home screen layout | L | Scrollable feed with: greeting, recently played, jump back in, recommendations, trending |
| T-091 | Build horizontal scroll "Recently Played" | M | Last 6 played tracks as square cards in horizontal scroll |
| T-092 | Build "Daily Mix" recommendation section | M | 20-track AI playlist displayed as a card with "Play" and "Shuffle" buttons |
| T-093 | Build "Based on [track]" section | M | Seed from last played track → show 10 similar tracks |
| T-094 | Scrape YouTube Music trending (backend) | L | `GET /trending` returns top 20 trending tracks in India, refreshed every 6 hours |
| T-095 | Build trending section in Home | M | Horizontal scroll of trending tracks with rank number |

---

## Phase 6 — Power Features (Week 8–10)

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-096 | Implement crossfade | L | Smooth 3-second audio crossfade between tracks using expo-av dual-source trick |
| T-097 | Build queue management | L | Full queue screen: current track, upcoming tracks, drag-to-reorder, swipe-to-remove |
| T-098 | Implement shuffle mode | M | Fisher-Yates shuffle on queue; original order restored when shuffle toggled off |
| T-099 | Implement repeat modes (none / one / all) | S | Repeat button cycles modes; icon changes; TrackPlayer respects mode |
| T-100 | Build 10-band Equalizer | XL | Sliders for 10 frequency bands + presets (flat, bass, vocal, classical, electronic); persists to Settings |
| T-101 | Implement sleep timer | M | Settings → Sleep Timer → pick duration → audio fades out and stops; notification shows countdown |
| T-102 | Implement playback speed control | M | 0.5× 0.75× 1× 1.25× 1.5× 2× speed options in full player; pitch correction enabled |
| T-103 | Last.fm scrobbling | L | After 50% of track played, `POST https://ws.audioscrobbler.com/2.0/` with track info; setup in Settings with API key input |
| T-104 | Discord Rich Presence | L | Backend `pypresence` service updates Discord status with current track; toggle in Settings |
| T-105 | Smart radio (autoplay when queue ends) | M | When queue exhausted, fetch 10 more recommendations seeded from last track and continue |
| T-106 | BPM filter for recommendations | M | Settings → Gym Mode → picks BPM range (100–180); recommendations filtered to BPM range |
| T-107 | Vibe search (semantic playlist) | XL | Input "rainy night lo-fi" → backend uses sentence-transformers to find matching tracks from history + search → auto-queue |
| T-108 | AI DJ mode | XL | Gemini API generates transition commentary between tracks; plays as TTS between songs |
| T-109 | Canvas / video background | XL | YouTube video (muted, looped, heavily blurred) plays as animated background in full player |
| T-110 | Collaborative listening room | XL | WebSocket room; host controls playback; guests sync to host position ±500ms; chat overlay |

---

## Phase 7 — Polish & Production (Week 11–12)

| ID | Task | Effort | Acceptance Criteria |
|----|------|--------|---------------------|
| T-111 | Implement empty states for all screens | M | Every screen has a thoughtful empty state message + action button (see DESIGN §7) |
| T-112 | Implement loading skeletons for all screens | M | No screen shows a blank flash before content loads |
| T-113 | Implement all error states + toasts | M | All error states from DESIGN §9 handled with appropriate snackbar/message |
| T-114 | Animations: track change transition | M | Album art scale + fade + background crossfade on track change (see DESIGN §4.2) |
| T-115 | Animations: play/pause button morph | S | Play icon morphs to pause with spring animation on tap |
| T-116 | Animations: lyrics scroll spring | S | Lyrics scroll to active line using spring animation (not linear) |
| T-117 | Accessibility: minimum touch targets (44px) | M | All interactive elements have minimum 44×44px touch area |
| T-118 | Accessibility: screen reader labels | M | All icon buttons have `accessibilityLabel` |
| T-119 | Accessibility: reduced motion support | S | `useReducedMotion()` check; disables animations if system setting is on |
| T-120 | Performance: FlashList for all lists | M | Replace any FlatList with FlashList; no dropped frames while scrolling |
| T-121 | Performance: image caching | M | expo-image with memory + disk cache; no repeated network fetches for same art |
| T-122 | Performance: memo + useCallback | M | React.memo on TrackListItem, LyricsLine; no unnecessary re-renders |
| T-123 | Sentry integration (frontend + backend) | M | Errors auto-reported to Sentry with user context; no PII leaked |
| T-124 | UptimeRobot uptime monitor | XS | Ping `/health` every 5min; email alert on downtime |
| T-125 | Write README.md with full setup instructions | L | Any developer (future you) can set up backend + mobile from README alone |
| T-126 | Build release APK via EAS | M | `eas build -p android --profile production` completes; APK installed on phone |
| T-127 | Dogfooding: use app exclusively for 7 days | — | No regressions; note bugs in GitHub issues for next sprint |

---

## Backlog (Post-Launch)

| ID | Task | Notes |
|----|------|-------|
| B-001 | iOS support | Same Expo codebase, minor platform tweaks |
| B-002 | Web player | React + same backend |
| B-003 | Android home screen widget | 4×1 widget with controls |
| B-004 | Android Auto support | Media session extension |
| B-005 | Wear OS companion | Basic playback controls |
| B-006 | Import Spotify playlists | Exportify CSV → match tracks via search |
| B-007 | Podcast support | RSS + yt-dlp for video podcasts |
| B-008 | Voice control | "Hey SoundFree, play something chill" |
| B-009 | Multi-user / family accounts | JWT auth + per-user history |
| B-010 | Desktop app (Electron) | Wrap web player |

---

## Sprint Planning

### Sprint 1 (Week 1–2): "Audio plays on my phone"
**Goal:** Search → tap track → audio plays from phone → lock screen controls visible.
**Tasks:** T-000 to T-053

### Sprint 2 (Week 3): "Feels like a real music app"
**Goal:** Lyrics scroll in sync, album art looks gorgeous, dynamic accent color works.
**Tasks:** T-054 to T-064

### Sprint 3 (Week 4–5): "I can use this daily"
**Goal:** Liked songs, playlists, offline mode, library screen all working.
**Tasks:** T-065 to T-082

### Sprint 4 (Week 6–7): "It knows what I like"
**Goal:** Home feed, recommendations, trending — app feels alive and personalized.
**Tasks:** T-083 to T-095

### Sprint 5 (Week 8–10): "This is better than Spotify"
**Goal:** EQ, crossfade, sleep timer, vibe search, AI DJ, collaborative listening.
**Tasks:** T-096 to T-110

### Sprint 6 (Week 11–12): "Ship it"
**Goal:** Polish, performance, accessibility, Sentry, release APK.
**Tasks:** T-111 to T-127

---

## Notes

- **Do not skip T-000 to T-010.** Project skeleton first. Every time. No exceptions.
- **Each task should result in a separate git commit** using conventional commit format.
- **Create a GitHub Issue for each task** and close it with the PR. This gives you a visual kanban board.
- **Never merge a PR that breaks the CI pipeline.**
- **If a task is blocked (status: `~`)**, document WHY in a comment on the GitHub Issue.
- **Effort estimates are rough.** If a task takes 3× estimated time, break it into subtasks.
