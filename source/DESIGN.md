# SoundFree — Design Document

**Version:** 1.0.0
**Status:** Active
**Last Updated:** 2026-03-15

---

## 1. Design Philosophy

SoundFree's design is built on one principle: **music is the product, not the UI**.

Every design decision should fade into the background and let the album art, lyrics, and music take centre stage. The interface should feel like holding a physical record — warm, tactile, and alive. Not a dashboard. Not an app. A listening experience.

**Core aesthetic:** Dark glass. Blurred album-art backgrounds that shift with every track. Typography that is large, confident, and readable at arm's length. Animations that feel musical — they breathe and pulse with the beat.

**Inspiration (collect these screenshots into your DESIGN folder):**
- Spotify's Now Playing screen (full-bleed art, minimal controls)
- BlackHole app (iOS, dark glass aesthetic)
- Lasso app (artist discovery, card-based browsing)
- Apple Music's lyrics view (karaoke-style word highlight)
- Doppler 2 (iOS, warm audiophile UI)
- Vinyls app (turntable animation, album-art focus)

---

## 2. Visual Identity

### 2.1 Color System

The UI uses a dynamic color system where the primary accent is extracted from the current track's album art using Palette API (Android). The palette shifts with every song.

**Base tokens (dark mode — primary):**
```
--bg-primary:       #0A0A0A   (near black, main background)
--bg-secondary:     #141414   (cards, bottom sheet)
--bg-tertiary:      #1E1E1E   (input fields, inactive tabs)
--bg-glass:         rgba(20, 20, 20, 0.7) + blur(24px)

--text-primary:     #FFFFFF   (track title, primary labels)
--text-secondary:   #A0A0A0   (artist name, metadata)
--text-tertiary:    #606060   (timestamps, disabled state)

--accent-dynamic:   [extracted from album art — changes per track]
--accent-fallback:  #1DB954   (Spotify green as default)

--border:           rgba(255,255,255,0.08)
--border-strong:    rgba(255,255,255,0.15)
```

**Light mode tokens (optional — implement after dark mode is perfect):**
```
--bg-primary:       #F5F5F5
--bg-secondary:     #FFFFFF
--text-primary:     #121212
--text-secondary:   #6B6B6B
```

### 2.2 Typography

```
Display (track title, full player):
  Font:   Instrument Serif (Google Fonts — elegant, musical)
  Size:   32px
  Weight: 400 (let the letterform do the work)

Heading (section titles, artist names):
  Font:   DM Sans
  Size:   18px
  Weight: 600

Body (lyrics, metadata, descriptions):
  Font:   DM Sans
  Size:   15px
  Weight: 400

Caption (timestamps, badges, mini labels):
  Font:   DM Sans
  Size:   12px
  Weight: 500
  Letter-spacing: 0.5px
  Text-transform: uppercase

Monospace (debug info, BPM display):
  Font:   JetBrains Mono
  Size:   13px
```

**Why Instrument Serif for the display?** Most music apps use grotesque sans-serifs everywhere and feel sterile. The serif display font on the track title gives a luxe, editorial feeling — like seeing a band name on a concert poster.

### 2.3 Spacing Scale

```
xs:   4px
sm:   8px
md:   16px
lg:   24px
xl:   32px
2xl:  48px
3xl:  64px
```

### 2.4 Corner Radius

```
pill:       9999px  (buttons, tags, badges)
card:       20px    (album art, cards, bottom sheets)
input:      12px    (search bar, form elements)
icon-btn:   50%     (circular icon buttons)
```

### 2.5 Elevation / Shadow

```
Level 1 (cards):      0 2px 8px rgba(0,0,0,0.4)
Level 2 (player):     0 8px 32px rgba(0,0,0,0.6)
Level 3 (modals):     0 16px 64px rgba(0,0,0,0.8)
Glow (accent):        0 0 24px [accent-color at 40% opacity]
```

---

## 3. Component Inventory

### 3.1 Bottom Tab Bar
- 4 tabs: Home, Search, Library, Profile
- Active tab: accent-dynamic color icon + label
- Inactive: text-tertiary, icon only
- Height: 64px + safe area inset
- Background: bg-glass (blurred)
- No border — just the blur separates it from content

### 3.2 Mini Player (Persistent Bottom Bar)
- Shows above tab bar at all times when a track is loaded
- Height: 72px
- Contents: Album art thumbnail (48×48, rx=8) | Track title + artist | Play/Pause button | Next button
- Background: bg-glass
- Tap → opens Full Player (bottom sheet, animated slide-up)
- Swipe left → skip track
- Swipe right → back
- Long-press → opens queue

### 3.3 Full Player Screen
This is the hero UI. It must be exceptional.

**Layout (top to bottom):**
1. Drag handle (pill, 40×4px, bg-tertiary)
2. Header: "Now Playing" label + Options menu (⋮)
3. **Album art** — 300×300, rx=20, glow shadow using accent color, subtle rotation animation (+/- 2° in time with music)
4. Track info: Title (display font, 28px) + Artist (body, accent color)
5. Like button + Add to playlist button (right-aligned inline)
6. **Progress bar** — custom slider, accent color fill, 4px height, large touch target
7. Time: elapsed left, remaining right (monospace caption)
8. **Main controls**: Shuffle | Prev | Play/Pause | Next | Repeat
   - Play/Pause: 72px circle, accent color background, white icon
   - Prev/Next: 48px, text-secondary icon
   - Shuffle/Repeat: 36px, changes to accent when active
9. Volume slider (optional — respects system volume)
10. Action row: Download | Share | Lyrics | Queue | Sleep timer
11. **Lyrics section** (if visible — tap "Lyrics" to toggle):
    - Full-screen overlay
    - Previous lines: text-tertiary, smaller
    - Current line: text-primary, larger, accent underline, slight scale-up animation
    - Next lines: text-secondary, fading out

**Background:** Full bleed album art, heavily blurred (blur=60px), darkened overlay (rgba(0,0,0,0.55)). Changes with a cross-fade animation when track changes.

### 3.4 Search Screen
- Header: "Search" title (heading font)
- **Search bar**: Full width, icon-left, rx=pill, bg-tertiary
  - On focus: border-strong, slight scale-up (0.98 → 1.0), keyboard shows
  - Results appear below as user types (debounced 300ms)
- **Browse categories** (when no search active):
  - Grid of 2 columns, colorful category cards
  - Categories: Bollywood | English Pop | Lo-fi | Hip-hop | Classical | Punjabi | Rock | Electronic | Mood | Trending
  - Each card: gradient background + category title
- **Search results:**
  - Track list (most common): album art thumbnail + title + artist + duration
  - Artist results: circular photo + name + follower count
  - Album results: square art + title + year

### 3.5 Library Screen
- Sections: Liked Songs | Downloaded | Playlists | Recently Played | Artists | Albums
- Liked Songs: special card (purple-to-green gradient, heart icon, track count)
- Downloaded: special card (green, download icon, size in MB, track count)
- Playlists: standard list with user-created playlists
- Filter tabs at top: All | Playlists | Artists | Albums

### 3.6 Track List Item
```
[48×48 album art, rx=8] [Title (16px, primary, bold)]    [⋮ menu]
                          [Artist (14px, secondary)]   [Duration]
```
- Active track: accent-colored left border (3px), title in accent color
- Long-press: context menu (Add to queue / Like / Download / Share / Add to playlist / Go to artist / Go to album)

### 3.7 Playlist Card (Grid)
```
[Square image or mosaic of 4 covers]
[Playlist name — bold]
[Track count + total duration — secondary]
```
- Tap → playlist detail page (header art, track list below)

### 3.8 Home Screen
- Greeting: "Good morning, [Name]" or time-appropriate
- Section: "Recently played" (horizontal scroll, square cards)
- Section: "Jump back in" (last 6 played)
- Section: "Your Daily Mix" (recommendation playlist, AI-generated)
- Section: "New releases" (from followed artists — scrape from YouTube)
- Section: "Based on [recent track]" (more like this)
- Section: "Trending in India" (YouTube Music trending scrape)

### 3.9 Artist Page
- Header: artist photo (full-width, faded bottom gradient)
- Artist name (large display font, white)
- Monthly listeners count (secondary)
- Follow button (pill, accent color)
- Sections: Popular tracks | Albums | Singles | Related artists

### 3.10 Queue Sheet
- Bottom sheet (drag up from mini player long-press)
- "Now Playing" header
- Current track highlighted
- Drag handles on each item to reorder
- Swipe left to remove from queue
- "Add to queue" button at bottom

---

## 4. Interaction Design

### 4.1 Gestures

| Gesture | Action |
|---------|--------|
| Tap mini player | Open full player |
| Swipe mini player left | Skip track |
| Swipe mini player right | Previous track |
| Long-press mini player | Open queue |
| Swipe full player down | Close to mini player |
| Tap album art (full player) | Toggle lyrics view |
| Long-press track item | Context menu |
| Swipe track item left | Add to queue |
| Swipe track item right | Like / unlike |
| Double-tap progress bar | Jump 10 seconds |
| Pinch album art | Nothing — resist the urge to add useless gestures |

### 4.2 Animations

**Track change animation:**
1. Old album art: scale from 1.0 → 1.05, fade to 0 (200ms, ease-out)
2. Background: cross-fade to new blurred art (400ms)
3. New album art: scale from 0.95 → 1.0, fade in (200ms, ease-in)
4. Track title: slide up from bottom (150ms, spring)

**Play/Pause button:**
- Tap: scale 0.92 → 1.0 (spring, 200ms) + icon morphs (pause → play bars animate)

**Lyrics scroll:**
- Current line: scale 1.0 → 1.04, color text-tertiary → text-primary (100ms)
- Scroll position: smooth spring animation, not linear

**Progress bar:**
- Scrubbing: thumb scales up (1.0 → 1.5), elapsed time shown in tooltip above thumb

**Tab transitions:** Shared element transition on album art when navigating from a track list to full player.

### 4.3 Accessibility

- All interactive elements: minimum 44×44px touch target
- Dynamic text support: respect system font size (DM Sans scales gracefully)
- Screen reader labels on all icon buttons
- High contrast mode: replace glass-blur effects with solid borders
- Reduced motion mode: disable animations, use instant transitions
- Color-blind safe: never convey meaning through color alone (use icons + labels)

---

## 5. Wireframes & Flows

### 5.1 Core User Flows

**Search → Play:**
```
Home → tap Search tab → type song name → tap track result → 
Mini player appears → tap mini player → Full Player opens
```

**Download for offline:**
```
Full Player → tap Download button → progress indicator → 
"Downloaded" badge appears on track → available in Library > Downloaded
```

**Create playlist:**
```
Library → "+" button → name playlist → playlist page opens (empty) →
Search for tracks → long-press track → "Add to playlist" → select playlist
```

**Enable lyrics:**
```
Full Player → tap "Lyrics" button → lyrics overlay slides up →
Lines scroll automatically in sync → tap anywhere to dismiss
```

### 5.2 Figma Reference
(Link your Figma file here once you create mockups)
`https://figma.com/file/[your-file-id]/SoundFree`

### 5.3 Screen Inventory

| Screen | Description |
|--------|-------------|
| Home | Personalized feed, recommendations, recently played |
| Search | Browse categories + live search results |
| Library | All saved content: liked, downloaded, playlists, history |
| Full Player | Album art, controls, lyrics, queue |
| Playlist Detail | Playlist header + track list |
| Artist Page | Artist info + discography |
| Album Page | Album art + tracklist |
| Queue | Current queue, drag-to-reorder |
| Settings | Audio quality, EQ, sleep timer, Last.fm, theme |
| Offline / Downloads | Manage downloaded tracks + storage info |

---

## 6. Dark / Light Mode

Dark mode is the default and primary design target. Light mode is a future nice-to-have.

The blurred background technique works exceptionally well in dark mode (dark overlay + blur = gorgeous). In light mode, it requires a lighter overlay and different shadow treatment.

**Switch control:** System-follows (respects Android system setting). Manual override in Settings.

---

## 7. Empty States

Every list screen must have a thoughtful empty state — not just "No items found."

| Screen | Empty State Message | Action |
|--------|---------------------|--------|
| Library > Liked Songs | "Nothing liked yet. Heart a track to save it here." | Search button |
| Library > Downloads | "No offline tracks. Download songs to listen without Wi-Fi." | Search button |
| Library > Playlists | "Your playlists will live here. Create one?" | "New Playlist" button |
| Home (no history) | "Welcome! Search for any song to get started." | Search button |
| Search (no results) | "No results for '[query]'. Try different keywords." | — |

---

## 8. Loading States

| State | Treatment |
|-------|-----------|
| Track loading | Progress bar pulses (opacity 0.4 → 1.0 loop) |
| Search results loading | 3 skeleton track items (shimmer animation) |
| Album art loading | Blurred low-res placeholder → crossfade to full res |
| Home feed loading | Skeleton cards in section layout |

---

## 9. Error States

| Error | UI Treatment |
|-------|-------------|
| No internet | Bottom snackbar: "No connection — playing from offline library" |
| Stream failed | Snackbar: "Couldn't load track. Trying next in queue..." → auto-skip |
| Lyrics not found | Lyrics panel shows: "Lyrics unavailable for this track" |
| Backend offline | Full screen: "Can't reach SoundFree server. Check that your backend is running." |
| Download failed | Toast: "Download failed. Check storage space." |

---

## 10. Platform-Specific Notes (Android)

- Use **Material You** color tokens where applicable (Android 12+)
- Support **edge-to-edge** display — content behind navigation bar, proper insets
- **Media session** integration for lock screen and notification controls
- **Android Auto** support (future): mini player in car dashboard
- **Widget** (future): 4×1 home screen widget with album art + controls
- Respect **Do Not Disturb** mode — no push notifications during DND
- Support **Bluetooth headphone buttons** (play/pause/skip via media keys)
