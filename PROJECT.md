# Music Bingo Web App

**Live URL:** https://kristinannabel.github.io
**Repo:** https://github.com/kristinannabel/kristinannabel.github.io
**Firebase Project:** music-bingo-fbe1c
**Spotify Client ID:** 4a27c13806da4316a1c4de46ee9e2b10

## What It Is

Multiplayer music bingo for parties/events. Up to 30 players join via room code on their phones, each getting a unique 4x4 bingo board. The admin (DJ) plays songs via Spotify and advances the game. Players listen, guess the song, and mark their boards. BINGO claims are auto-verified. Supports 1-3 rounds (one line, two lines, full board).

## Tech Stack

- **Hosting:** GitHub Pages (static, no build step)
- **Backend:** Firebase Realtime Database (free tier)
- **Frontend:** Vanilla HTML + CSS + JavaScript
- **Music:** Spotify embed player (admin only) + Spotify Web API for search
- **Auth:** SHA-256 hashed admin PIN, Spotify PKCE OAuth for track search

## File Structure

```
├── index.html              # Landing page: join game, create game, admin rejoin
├── admin.html              # DJ/admin panel
├── player.html             # Player bingo board
├── css/
│   └── style.css           # Dark purple/pink neon theme, mobile-first
├── js/
│   ├── firebase-config.js  # Firebase init (CDN compat v9.23.0)
│   ├── songs.js            # ~60-song pool, pickSongsForGame() picks 32 random
│   ├── board.js            # Seeded PRNG (Mulberry32) + board generation
│   ├── game.js             # Room creation, joining, PIN verification
│   ├── admin.js            # Admin panel logic (lobby, playing, finished views)
│   ├── player.js           # Player board, marks, real-time listeners
│   ├── bingo-check.js      # BINGO verification (shared)
│   └── spotify.js          # Spotify PKCE auth (search only, no playback SDK)
├── PROJECT.md              # This file
└── README.md               # GitHub default
```

## Firebase Data Model

```
/games/<roomCode>/
  meta/
    createdAt, adminPinHash, status ("lobby"|"playing"|"finished"),
    currentRound (1|2|3), currentSongIndex, boardSeed,
    winnerName, winnerId, totalRounds (1|2|3)
  songs/         # Array of 32 {number, title, artist, category, spotifyUri}
  songOrder/     # Shuffled play order (array of song numbers 1-32)
  calledSongs/   # Songs called so far (array of numbers)
  players/<id>/
    name, joinedAt, board (16 numbers), marks (16 bools), claimedBingo
```

## How It Works

### Game Flow
1. Admin creates game → gets room code (BINGO-XXXX)
2. Players join with room code + name → each gets unique 4x4 board
3. Admin connects Spotify, hits "Start Game" → auto-searches Spotify for all 32 songs
4. Admin hits "Next Song" → Spotify embed loads the track, admin presses play
5. Music plays from admin's device/speakers → players listen and mark boards
6. Player taps BINGO → client pre-check → Firebase claim → admin auto-verifies
7. Valid BINGO → celebration overlay for all players, round ends
8. Admin can advance rounds or start new game in same room

### Song Pool
- ~60 songs across 4 categories (~15 each): Norske Klassikere, Dansegulvet, Love Songs, Rock & Power
- Each game randomly picks 8 per category = 32 songs
- Songs are numbered 1-32 within each game
- Admin can edit songs in the lobby (title, artist, category)

### Board Generation
- Deterministic: seed = `boardSeed + playerId` → Mulberry32 PRNG → Fisher-Yates shuffle
- Each player gets 16 of 32 songs
- Rows sorted left-to-right (small→large), row order randomized

### BINGO Rules
- Round 1: ≥1 completed line (4 rows + 4 cols + 2 diags = 10 possible)
- Round 2: ≥2 completed lines
- Round 3: All 16 cells (full board)
- Verification: cell valid only if player marked it AND song was actually called

### Spotify Integration
- Admin connects via PKCE OAuth (no backend needed)
- On "Start Game": auto-searches all 32 songs using `track:"title" artist:"artist"` filters
- Spotify URIs stored in Firebase per game
- Admin sees Spotify embed iframe to play songs (manual play button)
- Players do NOT see or hear Spotify — they listen from venue speakers

### Player Experience
- No song name shown, no audio player — must listen and guess
- Board cells: tap to mark (red bingo dabber dot, like real bingo)
- No indication of which songs have been called (no highlights on uncalled songs)
- Song list shows all 32 songs by category (no checkmarks on called songs)
- Celebration overlay when someone wins
- Last round: board locks, "Waiting for new game..."

### Admin Features
- Real-time player list with click status (✓ Clicked / ⏳ Waiting)
- Count-up timer showing how long since last song was called
- Song editor (edit title/artist/category in lobby)
- Round selector, shuffle order
- Next Round / New Game (picks fresh songs, regenerates all boards)
- End Game (deletes from Firebase, sends everyone home)
- Auto-login after game creation (PIN hash in sessionStorage)

## Known Issues / TODO

- **Spotify song matching:** The search sometimes finds wrong tracks. Using `track:` and `artist:` filters helps but isn't perfect. Consider manually verifying and hardcoding Spotify track IDs for the default songs.
- **Spotify embed doesn't autoplay:** Admin must press play manually on the embed. This is a browser/Spotify limitation.
- **Spotify embed plays full songs:** The embed plays the entire track, not a 30s clip. Admin controls when to advance. (Spotify deprecated preview_url in late 2024.)
- **Player click detection:** Uses Firebase `child_changed` events. Sometimes misses clicks if Firebase batches updates. Could improve by writing a timestamp on each mark change.
- **Firebase security rules:** Currently open (read/write: true). Should add proper rules for production:
  - Board immutable after creation
  - Song list locked during play
  - Only admin can write to meta
- **No room code collision check:** Unlikely with ~280K combinations but not guarded.
- **No old game cleanup:** Games persist in Firebase until admin deletes them.
- **Session persistence:** Admin PIN hash is in sessionStorage (lost on tab close). Could use localStorage for longer persistence.

## Firebase Config

```javascript
{
  apiKey: "AIzaSyA158asrrevDpz0RWE547Qte1OimhdH4_E",
  authDomain: "music-bingo-fbe1c.firebaseapp.com",
  databaseURL: "https://music-bingo-fbe1c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "music-bingo-fbe1c",
  storageBucket: "music-bingo-fbe1c.firebasestorage.app",
  messagingSenderId: "218112519886",
  appId: "1:218112519886:web:4869d5bc3de68336f8ea9f"
}
```

## Spotify Setup

- Developer Dashboard: https://developer.spotify.com/dashboard
- App name: "Music Bingo"
- Redirect URI: `https://kristinannabel.github.io/admin.html`
- Scopes: `user-read-private`
- Auth flow: PKCE (no backend)

## Design

- Dark purple/pink neon theme with gradient backgrounds
- Animated rainbow gradient title
- Glowing room code display
- Bingo cells with red dabber dots (like real bingo markers)
- Confetti celebration on wins
- Mobile-first responsive (60-80px tap targets)
- Cards with depth and gradients
