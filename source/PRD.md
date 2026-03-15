# SoundFree — Product Requirements Document

**Version:** 1.0.0
**Status:** Active
**Owner:** Personal Project
**Last Updated:** 2026-03-15

---

## 1. Elevator Pitch

**SoundFree** is a personal, self-hosted music streaming app for Android that streams any song from YouTube instantly — with album art, time-synced lyrics, AI recommendations, and offline downloads — at zero cost and with zero ads, forever.

---

## 2. Problem Statement

Spotify Premium costs ₹119/month. YouTube Music Premium costs ₹99/month. Apple Music costs ₹99/month. Over 5 years, that is ₹7,140–₹8,580 spent just to listen to music I could access for free. Existing free alternatives either have:

- **Ads** that break listening flow
- **No offline support** (requires internet at all times)
- **No lyrics** or only static (non-synced) lyrics
- **No recommendations** that learn from personal taste
- **No album art** or poor quality thumbnails
- **No background playback** with lock screen controls
- **No crossfade, equalizer, or sleep timer**

SoundFree solves every single one of these gaps. It is built for personal use only, runs on a home server or free cloud tier, and gives a premium experience that rivals or exceeds paid services.

---

## 3. Goals

### 3.1 Business / Personal Goals
- Eliminate all music subscription costs permanently
- Build a portfolio-grade full-stack project (FastAPI + React Native)
- Learn audio streaming, ML recommendation systems, and mobile development
- Create something genuinely useful every single day

### 3.2 User Goals (as the sole user)
- Find any song in under 2 seconds and hear it within 3 seconds
- See real-time synced lyrics scrolling as music plays
- Get recommendations that feel eerily accurate, not generic
- Download songs for offline use on flight / poor connectivity
- Control playback from lock screen, earphone buttons, and notification
- Never hear an ad. Never hit a paywall. Never be asked to subscribe.

---

## 4. User Persona

**Primary User: Me (Sole User)**
- Location: Ambala, Haryana, India
- Devices: Android phone (primary), PC (backend host)
- Listening habits: Mix of Bollywood, English pop, lo-fi, hip-hop, classical
- Pain points: Ads on free Spotify, can't download on free tier, lyrics app is separate
- Technical level: Developer — comfortable with CLI, Docker, APIs
- Usage: 3–6 hours/day, commute + study + gym
- Key needs: Offline mode for commute, lyrics for singing along, gym playlists with BPM filter

---

## 5. MVP Features (Prioritized)

### Priority 1 — Core Playback (Week 1–2)
| # | Feature | Description |
|---|---------|-------------|
| 1.1 | Search | Search any song, artist, or album via YouTube Music API |
| 1.2 | Stream | Play audio via yt-dlp stream URL proxy — zero buffering |
| 1.3 | Now Playing UI | Full-screen player with album art, progress bar, controls |
| 1.4 | Background playback | Audio continues when phone screen is off |
| 1.5 | Lock screen controls | Play/pause/skip from Android notification + lock screen |

### Priority 2 — Rich Experience (Week 3–4)
| # | Feature | Description |
|---|---------|-------------|
| 2.1 | Synced lyrics | Word-by-word karaoke-style lyrics via lrclib.net |
| 2.2 | Album art | High-res cover art from MusicBrainz / Last.fm / YouTube |
| 2.3 | Queue management | Add to queue, reorder, clear, shuffle |
| 2.4 | Crossfade | Smooth 3-second transition between tracks |
| 2.5 | Repeat & shuffle | All standard playback modes |

### Priority 3 — Library & Offline (Week 5–6)
| # | Feature | Description |
|---|---------|-------------|
| 3.1 | Playlists | Create, edit, delete, reorder playlists |
| 3.2 | Liked songs | Heart any song; auto-playlist of liked tracks |
| 3.3 | Offline downloads | Download track + lyrics + art to phone storage |
| 3.4 | Recently played | Auto-tracked history with timestamps |
| 3.5 | Artist & album pages | Browse all tracks by an artist or from an album |

### Priority 4 — Intelligence (Week 7–8)
| # | Feature | Description |
|---|---------|-------------|
| 4.1 | Recommendations | ML-based "For You" daily mixes based on listening history |
| 4.2 | Smart radio | Auto-queue similar tracks when queue ends |
| 4.3 | Mood detection | Classify current listening mood (chill / energetic / focus) |
| 4.4 | BPM filter | Filter recommendations by tempo (e.g. gym: 120–180 BPM) |

### Priority 5 — Power Features (Week 9–12)
| # | Feature | Description |
|---|---------|-------------|
| 5.1 | Equalizer | 10-band EQ with presets (bass boost, vocal, flat) |
| 5.2 | Sleep timer | Auto-stop playback after N minutes |
| 5.3 | Last.fm scrobbling | Submit plays to Last.fm for lifetime stats |
| 5.4 | Discord Rich Presence | Show "Listening to X" in Discord status |
| 5.5 | AI DJ Mode | Gemini-powered playlist narration + transitions |
| 5.6 | Vibe search | "rainy night lo-fi" → instant curated playlist |
| 5.7 | Collaborative listening | Sync playback with a friend in real-time via WebSocket |
| 5.8 | Canvas / music video | Blurred YouTube video loop as animated background |

---

## 6. Non-Goals & Constraints

### 6.1 Non-Goals
- **Not a public product.** This will never be distributed, monetized, or made available to others. It is for personal use only.
- **Not a YouTube downloader for redistribution.** Audio is streamed, not redistributed.
- **No social features** (following, public profiles, sharing to social media) in MVP.
- **No iOS support** in V1 — Android only.
- **No web app** in V1 — mobile-first, API-backed.

### 6.2 Constraints
- **Budget: ₹0.** All infrastructure must be free tier or self-hosted.
- **No paid APIs.** YouTube Data API v3 has a free quota; ytmusicapi needs no key.
- **Backend must run on a modest machine** — home PC or Render/Railway free tier.
- **Legal:** Personal use only. Not a commercial product. yt-dlp usage is the user's own responsibility.

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Time to first audio byte | < 3 seconds from search result tap |
| Search result accuracy | First result is correct song > 90% of the time |
| Lyrics sync accuracy | Within ± 0.5 seconds of audio |
| Offline playback | Works 100% without any internet connection |
| App crash rate | 0 crashes per day in normal usage |
| Recommendation click rate | User plays recommended track > 50% of the time |
| Backend uptime | 99%+ (if self-hosted on always-on PC) |
| Streaming quality | 128kbps minimum, 160kbps target (Opus audio) |

---

## 8. Technical Constraints

- Android 10+ (API level 29+) minimum target
- FastAPI backend must respond to `/stream` within 1.5s (yt-dlp URL fetch + cache check)
- Redis stream URL cache TTL: 5 hours (YouTube URLs expire ~6 hours)
- Postgres free tier (Supabase): 500MB limit — store metadata only, never audio blobs
- Max playlist size: 5,000 tracks
- Offline storage: User-managed, no auto-purge

---

## 9. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| yt-dlp breaks due to YouTube changes | Medium | High | Monitor yt-dlp releases, auto-update weekly |
| Stream URL cache miss causes delay | High | Medium | Warm cache for "Recently Played" on app open |
| lrclib missing lyrics for obscure songs | Medium | Low | Fallback to Genius scraper, then show static lyrics |
| Supabase free tier quota exceeded | Low | Medium | Archive old play history, compress metadata |
| Railway/Render free tier sleeping | Medium | High | Use self-hosted or configure uptime ping |

---

## 10. Open Questions

- [ ] Should the backend expose a public URL (via Cloudflare Tunnel) or run LAN-only with Tailscale?
- [ ] Should the recommendation engine run as a background job (nightly) or on-demand?
- [ ] Should collaborative listening use a dedicated WebSocket server or piggyback on FastAPI's WebSocket support?
- [ ] At what point (hours of history) does the recommendation model have enough data to be useful?
