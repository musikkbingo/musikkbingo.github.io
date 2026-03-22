# Musikkbingo Web App

**Live URL:** https://musikkbingo.github.io
**Repo:** https://github.com/musikkbingo/musikkbingo.github.io
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
├── player.html             # Player bingo board (mobile tabs: Board/Songs/All)
├── css/
│   └── style.css           # Dark purple/pink neon theme, mobile-first
├── js/
│   ├── firebase-config.js  # Firebase init (CDN compat v9.23.0)
│   ├── songs.js            # ~200-song pool (50 per category), pickSongsForGame() picks 32
│   ├── board.js            # Seeded PRNG (Mulberry32) + board generation
│   ├── game.js             # Room creation, joining, PIN verification
│   ├── admin.js            # Admin panel logic (lobby, playing, finished views)
│   ├── player.js           # Player board, marks, real-time listeners, bingo check
│   ├── bingo-check.js      # BINGO verification (shared between admin and player)
│   └── spotify.js          # Spotify PKCE auth (search only, no playback SDK)
├── PROJECT.md              # This file
└── README.md
```

## Pre-Event Setup Checklist

### Firebase Database Rules
Go to [Firebase Console](https://console.firebase.google.com) → project **music-bingo-fbe1c** → Realtime Database → Rules. Ensure:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
**Important:** Firebase test mode rules expire after 30 days. If they've expired, nothing will work. Check and update them before the event.

### Spotify Redirect URI
Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → app → Settings → Redirect URIs. Must have:
```
https://musikkbingo.github.io/admin.html
```

### Firebase Free Tier Limits
- 100 simultaneous connections (30 players + 1 admin = 31, well within limits)
- 1GB storage, 10GB/month bandwidth — more than enough for a party
- No credit card needed

### Test Before the Event
1. Create a game, have 2-3 people join on phones
2. Connect Spotify in the lobby, hit Start Game
3. Play through 2-3 songs, verify Spotify embed loads
4. Test a bingo claim (mark a full row and press BINGO)
5. Test round transition (Next Round)
6. Verify celebration popup shows for all players

## Running the Event

### Admin Setup
1. Open https://musikkbingo.github.io on admin's laptop/phone
2. Create a new game (set PIN and number of rounds)
3. Connect laptop/phone to venue speakers (Bluetooth/aux/HDMI)
4. Click "Connect Spotify" in the lobby
5. Share room code with players (show on big screen if possible)
6. Wait for players to join, then hit "Start Game"

### During Gameplay
1. Hit **"Next Song"** → Spotify embed loads → press play on the embed
2. Count-up timer shows how long the song has played
3. Player list shows ✓/⏳ for who has guessed
4. **"⏮ Prev"** button goes back one song if needed
5. When someone gets BINGO → auto-verified → Spotify stops → celebration for all
6. Hit **"Next Round"** to continue (songs carry over between rounds)
7. If all 32 songs played with no bingo → **"No winner"** button appears

### Tips for 30 Players
- Tell players to keep their phone screen on (no auto-sleep)
- Players can switch between Board/Songs/All views using mobile tabs
- Board shows song numbers + titles — players match what they hear
- Red dabber dots mark selected cells (semi-transparent so numbers still visible)
- BINGO button only lights up when player has a valid pattern
- Wrong BINGO guess shows fun messages, doesn't penalize

### After the Game
- **New Game** button appears after the final round (picks fresh random songs)
- **End Game** deletes all data and sends everyone home
- Called songs list stays visible in the finished view (people can ask "what was song #15?")
- Game summary shows champion(s) and per-round winners

## Firebase Data Model

```
/games/<roomCode>/
  meta/
    createdAt, adminPinHash, status ("lobby"|"playing"|"finished"),
    currentRound (1|2|3), currentSongIndex, boardSeed,
    winnerName, winnerId, totalRounds (1|2|3),
    roundWinners/ { 1: "name", 2: "name", 3: "name" }
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
3. Admin connects Spotify, hits "Start Game" → auto-searches Spotify for all 32 songs (cached in Firebase for next time)
4. Admin hits "Next Song" → Spotify embed loads the track, admin presses play
5. Music plays from admin's device/speakers → players listen and mark boards
6. Player taps BINGO → pattern check → Firebase claim → admin auto-verifies
7. Valid BINGO → Spotify stops, celebration overlay for all players, round ends
8. Admin can advance rounds, end round with no winner, or start new game

### Song Pool
- ~200 songs across 4 categories (~50 each): Norske sanger 🇳🇴, Dansegulvet 🪩, Kjærleik 💕, Tidenes hits 🔥
- Each game randomly picks 8 per category = 32 songs
- Songs are numbered 1-32 within each game
- Admin can edit songs in the lobby (title, artist, category)
- Spotify URIs are cached in Firebase — only re-searched if songs change

### Board Generation
- Deterministic: seed = `boardSeed + playerId` → Mulberry32 PRNG → Fisher-Yates shuffle
- Each player gets 16 of 32 songs
- Rows sorted left-to-right (small→large), row order randomized

### BINGO Rules
- Round 1: ≥1 completed line (4 rows + 4 cols + 2 diags = 10 possible)
- Round 2: ≥2 completed lines
- Round 3: All 16 cells (full board)
- Verification: cell valid only if player marked it AND song was actually called
- BINGO button only activates when player has the required pattern marked
- Wrong guess (pattern exists but songs are wrong) → fun random message + shake animation

### Spotify Integration
- Admin connects via PKCE OAuth (no backend needed, token lasts ~1 hour)
- On "Start Game": auto-searches all 32 songs using `track:"title" artist:"artist"` filters
- Spotify URIs cached in Firebase (instant start next time if songs unchanged)
- Expired token detected automatically → shows reconnect button
- Admin sees Spotify embed iframe to play songs (manual play button)
- Players do NOT see or hear Spotify — they listen from venue speakers
- Spotify embed stops automatically when someone gets BINGO

### Player Experience
- Landing page: Join Game is the primary action, admin panel hidden behind toggle
- No song name shown, no audio player — must listen and guess
- Mobile tabs: 🎯 Board | 🎵 Songs | 📜 All (scroll mode)
- Board cells: tap to mark (semi-transparent red bingo dabber dot)
- Toast notification "🎵 Song 5 of 32 — listen up!" when DJ advances (no song name revealed)
- BINGO button disabled until valid pattern, then glows with animation
- Celebration overlay when someone wins (auto-dismissed on next round)
- Game over summary shows 🏆 champion and per-round winners

### Admin Features
- Auto-login after creating a game (no PIN re-entry)
- "Rejoin as Admin" on landing page for returning to existing games
- Real-time player list with click status (✓ Clicked / ⏳)
- Count-up timer showing song duration
- ⏮ Prev / ▶ Next Song controls
- Spotify embed with the current song
- Song editor (edit title/artist/category in lobby)
- Round selector, shuffle order
- "No winner" button when all 32 songs played without bingo
- Next Round / New Game (picks fresh songs, regenerates all boards)
- End Game (deletes from Firebase, sends everyone home)
- Called songs list visible after game ends

## Known Issues / TODO

- **Spotify song matching:** Search uses `track:` and `artist:` filters with fallback. Some Norwegian songs may match wrong tracks — admin should verify in the lobby and edit if needed.
- **Spotify embed doesn't autoplay:** Browser policy requires user interaction. Admin must press play manually.
- **Spotify token expires after ~1 hour:** Detected automatically, shows reconnect button. If running a long event, may need to reconnect mid-game.
- **Norwegian song titles:** Some titles in the pool may be inaccurate. The Spotify search finds the right track by artist, but the displayed title in the song list might not match exactly. Admin can edit in the lobby.
- **Full board (round 3) is very hard:** Players must correctly identify all 16 songs on their board. With 32 songs total, they need to recognize all of theirs. If no one gets it, use the "No winner" button.
- **Firebase security rules:** Currently open (read/write: true). Fine for a party game. For production, should add proper rules.
- **No room code collision check:** ~280K possible codes, collisions extremely unlikely.
- **No old game cleanup:** Games persist in Firebase until admin deletes them.

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
- Redirect URI: `https://musikkbingo.github.io/admin.html`
- Scopes: `user-read-private`
- Auth flow: PKCE (no backend needed)

## Design

- Dark purple/pink neon theme with gradient backgrounds and floating particles
- Animated rainbow gradient title on landing page
- Glowing room code display with pulse animation
- Bingo cells with semi-transparent red dabber dots (pop animation on mark)
- BINGO button: disabled = dimmed, ready = pulsing pink glow shimmer
- Confetti celebration (150 pieces, varied shapes and colors)
- Celebration modal with dramatic entrance animation
- Mobile-first responsive (60-80px tap targets)
- Sticky mobile tab bar for Board/Songs/All views
- Category emojis: 🇳🇴 Norske sanger, 🪩 Dansegulvet, 💕 Kjærleik, 🔥 Tidenes hits
- Song categories in mini-cards with hover glow (desktop only)
- Song numbers in purple circular badges
- Player header: large centered name with gradient border
- Admin header: "🎧 Music Bingo DJ" with rainbow border
