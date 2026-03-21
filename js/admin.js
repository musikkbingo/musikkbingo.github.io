// Admin panel logic for Music Bingo
// Requires: firebase-config.js, songs.js, board.js, bingo-check.js, game.js

(function () {
  'use strict';

  // ===== State =====
  var roomCode = null;
  var meta = null;
  var songs = [];
  var songOrder = [];
  var calledSongs = [];
  var players = {};
  var listeners = [];

  // ===== DOM References =====
  var authSection = document.getElementById('auth-section');
  var adminPanel = document.getElementById('admin-panel');
  var pinForm = document.getElementById('pin-form');
  var adminPinInput = document.getElementById('admin-pin');
  var authError = document.getElementById('auth-error');

  var headerRoomCode = document.getElementById('header-room-code');
  var headerStatus = document.getElementById('header-status');

  var lobbySection = document.getElementById('lobby-section');
  var playingSection = document.getElementById('playing-section');
  var finishedSection = document.getElementById('finished-section');

  // Lobby
  var lobbyRoomCode = document.getElementById('lobby-room-code');
  var copyCodeBtn = document.getElementById('copy-code-btn');
  var playerCount = document.getElementById('player-count');
  var playerList = document.getElementById('player-list');
  var roundSelect = document.getElementById('round-select');
  var shuffleOrderBtn = document.getElementById('shuffle-order-btn');
  var saveSongsBtn = document.getElementById('save-songs-btn');
  var songTableBody = document.getElementById('song-table-body');
  var startGameBtn = document.getElementById('start-game-btn');

  // Playing
  var roundIndicator = document.getElementById('round-indicator');
  var songProgress = document.getElementById('song-progress');
  var roundRequirement = document.getElementById('round-requirement');
  var currentSongNumber = document.getElementById('current-song-number');
  var currentSongTitle = document.getElementById('current-song-title');
  var currentSongArtist = document.getElementById('current-song-artist');
  var nextSongBtn = document.getElementById('next-song-btn');
  var prevSongBtn = document.getElementById('prev-song-btn');
  var calledSongsList = document.getElementById('called-songs-list');
  var playingPlayerCount = document.getElementById('playing-player-count');
  var playingPlayerList = document.getElementById('playing-player-list');

  // Finished
  var winnerDisplay = document.getElementById('winner-display');
  var finishedRoundInfo = document.getElementById('finished-round-info');
  var nextRoundArea = document.getElementById('next-round-area');
  var nextRoundBtn = document.getElementById('next-round-btn');
  var gameOverArea = document.getElementById('game-over-area');
  // endGameBtn removed - replaced by per-section buttons
  var endGamePlayingBtn = document.getElementById('end-game-playing-btn');
  var endGameFinishedBtn = document.getElementById('end-game-finished-btn');
  var endGameLobbyBtn = document.getElementById('end-game-lobby-btn');
  var newGameBtn = document.getElementById('new-game-btn');
  var newGameRounds = document.getElementById('new-game-rounds');

  // Spotify
  var spotifyConnectBtn = document.getElementById('spotify-connect-btn');

  // ===== Init =====
  var params = new URLSearchParams(window.location.search);
  roomCode = params.get('room');

  if (!roomCode) {
    authError.textContent = 'No room code provided. Go back to the home page.';
    pinForm.querySelector('button').disabled = true;
    return;
  }

  // ===== Auto-login if session has PIN hash (from create game or admin login) =====
  (async function () {
    var storedHash = sessionStorage.getItem('admin_pin_hash');
    var storedRoom = sessionStorage.getItem('admin_room');
    if (storedHash && storedRoom === roomCode) {
      // Verify the stored hash matches
      var metaSnap = await window.db.ref('games/' + roomCode + '/meta').once('value');
      if (metaSnap.exists() && metaSnap.val().adminPinHash === storedHash) {
        showAdminPanel();
        return;
      }
    }
  })();

  // ===== Auth Flow =====
  pinForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    authError.textContent = '';

    var pin = adminPinInput.value.trim();
    if (!pin) {
      authError.textContent = 'Please enter the admin PIN.';
      return;
    }

    var btn = pinForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    try {
      var valid = await window.verifyAdmin(roomCode, pin);
      if (valid) {
        showAdminPanel();
      } else {
        authError.textContent = 'Invalid PIN. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    } catch (err) {
      authError.textContent = err.message || 'Verification failed. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });

  // ===== Show Admin Panel =====
  function showAdminPanel() {
    authSection.classList.add('hidden');
    adminPanel.classList.remove('hidden');

    headerRoomCode.textContent = 'BINGO-' + roomCode;
    lobbyRoomCode.textContent = 'BINGO-' + roomCode;

    setupListeners();
  }

  // ===== Firebase Listeners =====
  function setupListeners() {
    var gameRef = window.db.ref('games/' + roomCode);

    // Meta listener
    var metaRef = gameRef.child('meta');
    metaRef.on('value', function (snap) {
      if (!snap.exists()) return;
      meta = snap.val();
      updateStatusDisplay();
      updateView();
    });
    listeners.push({ ref: metaRef, event: 'value' });

    // Songs listener
    var songsRef = gameRef.child('songs');
    songsRef.on('value', function (snap) {
      songs = snap.val() || [];
      renderSongTable();
      updateSpotifyLinkStatus();
    });
    listeners.push({ ref: songsRef, event: 'value' });

    // Song order listener
    var orderRef = gameRef.child('songOrder');
    orderRef.on('value', function (snap) {
      songOrder = snap.val() || [];
      // Re-render playing view if we're in playing state (fixes refresh)
      if (meta && meta.status === 'playing') updatePlayingView();
    });
    listeners.push({ ref: orderRef, event: 'value' });

    // Called songs listener
    var calledRef = gameRef.child('calledSongs');
    calledRef.on('value', function (snap) {
      var val = snap.val();
      calledSongs = Array.isArray(val) ? val : [];
      renderCalledSongs();
      // Re-render playing view if we're in playing state (fixes refresh)
      if (meta && meta.status === 'playing') updatePlayingView();
    });
    listeners.push({ ref: calledRef, event: 'value' });

    // Players listener
    var playersRef = gameRef.child('players');
    playersRef.on('value', function (snap) {
      players = snap.val() || {};
      renderPlayerList();
    });
    listeners.push({ ref: playersRef, event: 'value' });

    // Player activity + bingo claim listener
    var processedClaims = {}; // track which claims we've already handled

    playersRef.on('child_changed', function (snap) {
      var playerId = snap.key;
      var playerData = snap.val();
      if (!playerData) return;

      // Track player clicks
      onPlayerActivity(playerId);

      // Check for bingo claims - only process fresh claims
      var claimKey = playerId + '_' + (meta ? meta.currentRound : 0);
      if (playerData.claimedBingo === true && meta && meta.status === 'playing' && !processedClaims[claimKey]) {
        processedClaims[claimKey] = true;
        handleBingoClaim(playerId, playerData);
      }
    });
    listeners.push({ ref: playersRef, event: 'child_changed' });
  }

  // ===== View Management =====
  function updateView() {
    if (!meta) return;

    lobbySection.classList.add('hidden');
    playingSection.classList.add('hidden');
    finishedSection.classList.add('hidden');

    if (meta.status === 'lobby') {
      lobbySection.classList.remove('hidden');
      roundSelect.value = String(meta.totalRounds || 3);
      renderPlayerList();
    } else if (meta.status === 'playing') {
      playingSection.classList.remove('hidden');
      updatePlayingView();
    } else if (meta.status === 'finished') {
      finishedSection.classList.remove('hidden');
      updateFinishedView();
    }
  }

  function updateStatusDisplay() {
    if (!meta) return;
    var status = meta.status || 'lobby';
    headerStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    headerStatus.className = 'status-badge ' + status;
  }

  // ===== Lobby Functions =====

  // Copy room code
  copyCodeBtn.addEventListener('click', function () {
    var code = 'BINGO-' + roomCode;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(function () {
        copyCodeBtn.textContent = 'Copied!';
        setTimeout(function () { copyCodeBtn.textContent = 'Copy Code'; }, 2000);
      });
    } else {
      // Fallback
      var textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copyCodeBtn.textContent = 'Copied!';
      setTimeout(function () { copyCodeBtn.textContent = 'Copy Code'; }, 2000);
    }
  });

  // Round selector
  roundSelect.addEventListener('change', function () {
    var val = parseInt(roundSelect.value, 10);
    window.db.ref('games/' + roomCode + '/meta/totalRounds').set(val);
  });

  // Song table rendering
  function renderSongTable() {
    songTableBody.innerHTML = '';
    for (var i = 0; i < songs.length; i++) {
      var song = songs[i];
      var tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';

      var tdNum = document.createElement('td');
      tdNum.style.padding = '0.4rem 0.5rem';
      tdNum.style.color = 'var(--text-muted)';
      tdNum.style.fontWeight = '700';
      tdNum.textContent = song.number;

      var tdTitle = document.createElement('td');
      tdTitle.style.padding = '0.4rem 0.5rem';
      var inputTitle = createEditableInput(i, 'title', song.title);
      tdTitle.appendChild(inputTitle);

      var tdArtist = document.createElement('td');
      tdArtist.style.padding = '0.4rem 0.5rem';
      var inputArtist = createEditableInput(i, 'artist', song.artist);
      tdArtist.appendChild(inputArtist);

      var tdCategory = document.createElement('td');
      tdCategory.style.padding = '0.4rem 0.5rem';
      var inputCategory = createEditableInput(i, 'category', song.category);
      tdCategory.appendChild(inputCategory);

      tr.appendChild(tdNum);
      tr.appendChild(tdTitle);
      tr.appendChild(tdArtist);
      tr.appendChild(tdCategory);
      songTableBody.appendChild(tr);
    }
  }

  function createEditableInput(index, field, value) {
    var input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.dataset.index = index;
    input.dataset.field = field;
    input.style.background = 'var(--bg-input)';
    input.style.color = 'var(--text-primary)';
    input.style.border = '1px solid var(--border)';
    input.style.borderRadius = 'var(--radius)';
    input.style.padding = '0.3em 0.5em';
    input.style.fontSize = '0.85rem';
    input.style.width = '100%';
    input.addEventListener('change', function () {
      var idx = parseInt(this.dataset.index, 10);
      var f = this.dataset.field;
      songs[idx][f] = this.value;
      // Clear Spotify URI when title or artist changes so it gets re-searched on start
      if (f === 'title' || f === 'artist') {
        songs[idx].spotifyUri = null;
      }
    });
    return input;
  }

  // Save songs to Firebase
  saveSongsBtn.addEventListener('click', function () {
    window.db.ref('games/' + roomCode + '/songs').set(songs).then(function () {
      saveSongsBtn.textContent = 'Saved!';
      setTimeout(function () { saveSongsBtn.textContent = 'Save Changes'; }, 2000);
    });
  });

  // Shuffle order
  shuffleOrderBtn.addEventListener('click', function () {
    var numbers = [];
    for (var i = 1; i <= 32; i++) {
      numbers.push(i);
    }
    // Fisher-Yates shuffle
    for (var j = numbers.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = numbers[j];
      numbers[j] = numbers[k];
      numbers[k] = tmp;
    }
    window.db.ref('games/' + roomCode + '/songOrder').set(numbers).then(function () {
      shuffleOrderBtn.textContent = 'Shuffled!';
      setTimeout(function () { shuffleOrderBtn.textContent = 'Shuffle Order'; }, 2000);
    });
  });

  // ===== Spotify song linking =====
  var spotifyLinkStatus = document.getElementById('spotify-link-status');

  // Search Spotify for a single song, return URI or null
  async function searchSpotifyTrack(title, artist, token) {
    try {
      var query = encodeURIComponent('track:"' + title + '" artist:"' + artist + '"');
      var resp = await fetch('https://api.spotify.com/v1/search?q=' + query + '&type=track&limit=5', {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      // Token expired
      if (resp.status === 401) {
        sessionStorage.removeItem('spotify_access_token');
        return 'TOKEN_EXPIRED';
      }

      var data = await resp.json();

      var bestTrack = null;
      if (data.tracks && data.tracks.items) {
        var titleLower = title.toLowerCase();
        for (var t = 0; t < data.tracks.items.length; t++) {
          if (data.tracks.items[t].name.toLowerCase() === titleLower) {
            bestTrack = data.tracks.items[t];
            break;
          }
        }
        if (!bestTrack && data.tracks.items.length > 0) {
          bestTrack = data.tracks.items[0];
        }
      }

      if (bestTrack) return bestTrack.uri;

      // Fallback: simpler query
      var fbQuery = encodeURIComponent(title + ' ' + artist);
      var fbResp = await fetch('https://api.spotify.com/v1/search?q=' + fbQuery + '&type=track&limit=1', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var fbData = await fbResp.json();
      if (fbData.tracks && fbData.tracks.items && fbData.tracks.items.length > 0) {
        return fbData.tracks.items[0].uri;
      }
    } catch (err) { /* ignore */ }
    return null;
  }

  // Link all songs missing Spotify URIs, save to Firebase
  async function linkAllSongs(statusEl) {
    var token = window.spotifyAPI ? window.spotifyAPI.getToken() : null;
    if (!token) {
      alert('Connect Spotify first!');
      return false;
    }

    var missing = [];
    for (var i = 0; i < songs.length; i++) {
      if (!songs[i].spotifyUri) missing.push(i);
    }

    if (missing.length === 0) {
      if (statusEl) statusEl.textContent = '✓ All songs linked';
      return true;
    }

    var failed = [];
    for (var m = 0; m < missing.length; m++) {
      var idx = missing[m];
      var song = songs[idx];
      if (statusEl) statusEl.textContent = 'Linking... (' + (m + 1) + '/' + missing.length + ')';

      var uri = await searchSpotifyTrack(song.title, song.artist, token);
      if (uri === 'TOKEN_EXPIRED') {
        var ls = document.getElementById('spotify-lobby-status');
        var lb = document.getElementById('spotify-lobby-connect-btn');
        if (ls) { ls.textContent = '🔴 Session expired'; ls.style.color = 'var(--danger)'; }
        if (lb) lb.classList.remove('hidden');
        if (statusEl) statusEl.textContent = 'Spotify expired — reconnect';
        alert('Spotify session expired. Reconnect Spotify and try again.');
        return false;
      }
      if (uri) {
        songs[idx].spotifyUri = uri;
      } else {
        failed.push(song.number + '. ' + song.title);
      }
    }

    // Save to Firebase (persists URIs for next time)
    await window.db.ref('games/' + roomCode + '/songs').set(songs);

    if (failed.length > 0) {
      if (statusEl) statusEl.textContent = failed.length + ' songs not found';
      alert(failed.length + ' songs not found on Spotify:\n' + failed.slice(0, 5).join('\n') + (failed.length > 5 ? '\n...and ' + (failed.length - 5) + ' more' : '') + '\n\nFix the song names and try again.');
      return false;
    }

    if (statusEl) statusEl.textContent = '✓ All ' + songs.length + ' songs linked';
    return true;
  }

  // Update link status when songs load
  function updateSpotifyLinkStatus() {
    if (!spotifyLinkStatus) return;
    var linked = 0;
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].spotifyUri) linked++;
    }
    if (linked === songs.length) {
      spotifyLinkStatus.textContent = '✓ All ' + linked + ' songs linked';
      spotifyLinkStatus.style.color = 'var(--success)';
    } else {
      spotifyLinkStatus.textContent = linked + '/' + songs.length + ' linked';
      spotifyLinkStatus.style.color = 'var(--warning)';
    }
  }

  // Start game
  startGameBtn.addEventListener('click', async function () {
    // Check all songs have Spotify URIs
    var missing = 0;
    for (var i = 0; i < songs.length; i++) {
      if (!songs[i].spotifyUri) missing++;
    }

    if (missing > 0) {
      // Try auto-linking
      startGameBtn.disabled = true;
      startGameBtn.textContent = 'Linking songs...';
      var ok = await linkAllSongs(spotifyLinkStatus);
      startGameBtn.disabled = false;
      startGameBtn.textContent = 'Start Game';
      if (!ok) return;
    }

    window.db.ref('games/' + roomCode + '/meta/status').set('playing');
  });

  // ===== Spotify Connect =====
  var spotifyLobbyConnect = document.getElementById('spotify-lobby-connect-btn');

  function connectSpotify() {
    if (window.spotifyAPI) window.spotifyAPI.connect();
  }
  if (spotifyConnectBtn) spotifyConnectBtn.addEventListener('click', connectSpotify);
  if (spotifyLobbyConnect) spotifyLobbyConnect.addEventListener('click', connectSpotify);

  // ===== Admin Spotify embed (admin only - players hear from speakers) =====
  var adminEmbedEl = document.getElementById('admin-spotify-embed');

  function playAdminEmbed(trackId) {
    if (!adminEmbedEl || !trackId) return;
    if (adminEmbedEl.dataset.currentTrack === trackId) return;
    adminEmbedEl.dataset.currentTrack = trackId;
    adminEmbedEl.innerHTML = '<iframe src="https://open.spotify.com/embed/track/' + trackId + '?utm_source=generator&theme=0" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px;"></iframe>';
  }

  // ===== Player List Rendering =====
  function renderPlayerList() {
    var keys = Object.keys(players);
    var count = keys.length;

    // Update counts
    playerCount.textContent = count + ' player' + (count !== 1 ? 's' : '');
    playingPlayerCount.textContent = count + ' player' + (count !== 1 ? 's' : '');

    // Sort by joinedAt
    keys.sort(function (a, b) {
      return (players[a].joinedAt || 0) - (players[b].joinedAt || 0);
    });

    // Lobby player list
    if (count === 0) {
      playerList.innerHTML = '<li class="text-muted">Waiting for players to join...</li>';
    } else {
      playerList.innerHTML = '';
      for (var i = 0; i < keys.length; i++) {
        var p = players[keys[i]];
        var li = document.createElement('li');
        var nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = p.name;
        var statusSpan = document.createElement('span');
        statusSpan.className = 'player-status';
        if (p.joinedAt) {
          var d = new Date(p.joinedAt);
          statusSpan.textContent = 'Joined ' + d.toLocaleTimeString();
        }
        li.appendChild(nameSpan);
        li.appendChild(statusSpan);
        playerList.appendChild(li);
      }
    }

    // Playing player list
    if (count === 0) {
      playingPlayerList.innerHTML = '<li class="text-muted">No players</li>';
    } else {
      playingPlayerList.innerHTML = '';
      for (var j = 0; j < keys.length; j++) {
        var pid = keys[j];
        var pl = players[pid];
        var li2 = document.createElement('li');
        var nameSpan2 = document.createElement('span');
        nameSpan2.className = 'player-name';
        nameSpan2.textContent = pl.name;
        var statusSpan2 = document.createElement('span');
        if (pl.claimedBingo) {
          statusSpan2.className = 'player-status bingo-claimed';
          statusSpan2.textContent = 'BINGO claimed!';
        } else if (playerHasClickedSinceSnapshot(pid)) {
          statusSpan2.className = 'player-status';
          statusSpan2.style.color = 'var(--success)';
          statusSpan2.textContent = '✓ Clicked';
        } else {
          statusSpan2.className = 'player-status';
          statusSpan2.textContent = (meta && meta.status === 'playing') ? '⏳' : 'Joined';
        }
        li2.appendChild(nameSpan2);
        li2.appendChild(statusSpan2);
        playingPlayerList.appendChild(li2);
      }
    }
  }

  // ===== Playing View =====
  function updatePlayingView() {
    if (!meta) return;

    var currentRound = meta.currentRound || 1;
    var totalRounds = meta.totalRounds || 3;
    var currentIndex = meta.currentSongIndex != null ? meta.currentSongIndex : -1;

    // Round info
    roundIndicator.textContent = 'Round ' + currentRound + ' of ' + totalRounds;

    var requirementTexts = {
      1: 'Round 1: One line',
      2: 'Round 2: Two lines',
      3: 'Round 3: Full board'
    };
    roundRequirement.textContent = requirementTexts[currentRound] || '';

    // Song progress
    var calledCount = calledSongs.length;
    songProgress.textContent = 'Song ' + calledCount + ' of 32';

    // Current song display
    if (currentIndex === -1 || !songOrder || songOrder.length === 0 || waitingForNextSong) {
      currentSongNumber.textContent = '-';
      currentSongTitle.textContent = 'Ready to start';
      currentSongArtist.textContent = 'Press "Next Song" to begin';
    } else {
      var songNum = songOrder[currentIndex];
      var song = findSongByNumber(songNum);
      currentSongNumber.textContent = songNum;
      currentSongTitle.textContent = song ? song.title : 'Song #' + songNum;
      currentSongArtist.textContent = song ? song.artist : '';

      // Load Spotify embed for current song (deduplicates internally)
      if (song && song.spotifyUri) {
        var trackId = song.spotifyUri.replace('spotify:track:', '');
        playAdminEmbed(trackId);
      }
    }

    // Disable next/prev song buttons based on position
    nextSongBtn.disabled = (currentIndex >= 31);
    if (prevSongBtn) prevSongBtn.disabled = (currentIndex <= 0);

    renderCalledSongs();
  }

  function findSongByNumber(num) {
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].number === num) return songs[i];
    }
    return null;
  }

  // Song timer - count up from 0 when a new song is called
  var songTimer = null;
  var waitingForNextSong = false; // true after round transition until Next Song pressed
  var songSeconds = 0;
  var songTimerEl = document.getElementById('song-timer');

  // Track which players clicked since last song
  var clickedPlayers = {}; // playerId -> true

  function startSongTimer() {
    songSeconds = 0;
    clickedPlayers = {};
    renderPlayerList();
    if (songTimer) clearInterval(songTimer);
    if (songTimerEl) songTimerEl.textContent = '0:00';
    songTimer = setInterval(function () {
      songSeconds++;
      var mins = Math.floor(songSeconds / 60);
      var secs = songSeconds % 60;
      if (songTimerEl) songTimerEl.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    }, 1000);
  }

  function stopSongTimer() {
    if (songTimer) { clearInterval(songTimer); songTimer = null; }
  }

  // Track when any player clicks their board
  function onPlayerActivity(playerId) {
    clickedPlayers[playerId] = true;
    renderPlayerList();
  }

  function playerHasClickedSinceSnapshot(playerId) {
    return !!clickedPlayers[playerId];
  }

  nextSongBtn.addEventListener('click', function () {
    if (!meta) return;
    waitingForNextSong = false;
    var currentIndex = meta.currentSongIndex != null ? meta.currentSongIndex : -1;
    var newIndex = currentIndex + 1;

    if (newIndex >= songOrder.length) return;

    var songNum = songOrder[newIndex];
    var newCalledSongs = calledSongs.slice();
    newCalledSongs.push(songNum);

    var updates = {};
    updates['meta/currentSongIndex'] = newIndex;
    updates['calledSongs'] = newCalledSongs;

    window.db.ref('games/' + roomCode).update(updates);

    // Play Spotify embed on admin
    var song = findSongByNumber(songNum);
    if (song && song.spotifyUri) {
      var trackId = song.spotifyUri.replace('spotify:track:', '');
      playAdminEmbed(trackId);
    }

    // Start count-up timer and reset click tracking
    startSongTimer();
  });

  // Previous song - go back one song (replay)
  if (prevSongBtn) {
    prevSongBtn.addEventListener('click', function () {
      if (!meta) return;
      var currentIndex = meta.currentSongIndex != null ? meta.currentSongIndex : -1;
      if (currentIndex <= 0) return;

      var newIndex = currentIndex - 1;
      // Remove last called song
      var newCalledSongs = calledSongs.slice();
      newCalledSongs.pop();

      var updates = {};
      updates['meta/currentSongIndex'] = newIndex;
      updates['calledSongs'] = newCalledSongs;

      window.db.ref('games/' + roomCode).update(updates);

      var songNum = songOrder[newIndex];
      var song = findSongByNumber(songNum);
      if (song && song.spotifyUri) {
        var trackId = song.spotifyUri.replace('spotify:track:', '');
        adminEmbedEl.dataset.currentTrack = '';
        playAdminEmbed(trackId);
      }

      startSongTimer();
    });
  }

  // Render called songs list
  function renderCalledSongs() {
    if (!calledSongs || calledSongs.length === 0) {
      calledSongsList.innerHTML = '<li class="text-muted">No songs called yet</li>';
      return;
    }

    calledSongsList.innerHTML = '';
    // Show most recent first
    for (var i = calledSongs.length - 1; i >= 0; i--) {
      var num = calledSongs[i];
      var song = findSongByNumber(num);
      var li = document.createElement('li');
      li.style.padding = '0.4rem 0.5rem';
      li.style.borderBottom = '1px solid var(--border)';
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';

      var numSpan = document.createElement('span');
      numSpan.style.fontWeight = '700';
      numSpan.style.color = 'var(--accent)';
      numSpan.style.minWidth = '2em';
      numSpan.textContent = '#' + num;

      var titleSpan = document.createElement('span');
      titleSpan.style.flex = '1';
      titleSpan.style.marginLeft = '0.75rem';
      titleSpan.textContent = song ? song.title + ' - ' + song.artist : 'Song #' + num;

      var orderSpan = document.createElement('span');
      orderSpan.style.color = 'var(--text-muted)';
      orderSpan.style.fontSize = '0.8rem';
      orderSpan.textContent = '(' + (i + 1) + ')';

      li.appendChild(numSpan);
      li.appendChild(titleSpan);
      li.appendChild(orderSpan);
      calledSongsList.appendChild(li);
    }
  }

  // ===== BINGO Handler =====
  function handleBingoClaim(playerId, playerData) {
    // Guard: ignore claims from players with invalid/missing data
    var board = playerData.board || [];
    var marks = playerData.marks || [];
    if (!Array.isArray(board) || board.length !== 16 || !Array.isArray(marks) || marks.length < 16) {
      window.db.ref('games/' + roomCode + '/players/' + playerId + '/claimedBingo').set(false);
      return;
    }

    // Fresh read of calledSongs to avoid race condition
    window.db.ref('games/' + roomCode + '/calledSongs').once('value', function (snap) {
      var freshCalled = snap.val();
      freshCalled = Array.isArray(freshCalled) ? freshCalled : [];

      var currentRound = meta.currentRound || 1;

      var isValid = window.checkBingo(board, marks, freshCalled, currentRound);

      if (isValid) {
        var updates = {
          'meta/winnerName': playerData.name,
          'meta/winnerId': playerId,
          'meta/status': 'finished'
        };
        window.db.ref('games/' + roomCode).update(updates);
        showCelebration();
      } else {
        window.db.ref('games/' + roomCode + '/players/' + playerId + '/claimedBingo').set(false);
      }
    });
  }

  // ===== Finished View =====
  function updateFinishedView() {
    if (!meta) return;

    var winnerName = meta.winnerName || 'Unknown';
    var currentRound = meta.currentRound || 1;
    var totalRounds = meta.totalRounds || 3;

    winnerDisplay.textContent = winnerName + ' wins!';
    finishedRoundInfo.textContent = 'Round ' + currentRound + ' of ' + totalRounds + ' complete';

    if (currentRound < totalRounds) {
      nextRoundArea.classList.remove('hidden');
      gameOverArea.classList.add('hidden');
    } else {
      nextRoundArea.classList.add('hidden');
      gameOverArea.classList.remove('hidden');
    }
  }

  // Next round
  nextRoundBtn.addEventListener('click', function () {
    if (!meta) return;
    var newRound = (meta.currentRound || 1) + 1;
    var currentIdx = meta.currentSongIndex != null ? meta.currentSongIndex : -1;
    var updates = {
      'meta/currentRound': newRound,
      'meta/currentSongIndex': currentIdx, // keep song position (songs carry over)
      'meta/winnerName': null,
      'meta/winnerId': null,
      'meta/status': 'playing'
    };
    window.db.ref('games/' + roomCode).update(updates);

    // Reset all players' claimedBingo
    var keys = Object.keys(players);
    for (var i = 0; i < keys.length; i++) {
      window.db.ref('games/' + roomCode + '/players/' + keys[i] + '/claimedBingo').set(false);
    }

    // Reset admin state for new round
    clickedPlayers = {};
    waitingForNextSong = true;
    stopSongTimer();
    if (adminEmbedEl) { adminEmbedEl.innerHTML = ''; adminEmbedEl.dataset.currentTrack = ''; }
  });

  // End game - deletes game data and goes back to lobby
  function endGame() {
    if (confirm('End this game? All data will be deleted and players will be sent home.')) {
      window.db.ref('games/' + roomCode).remove().then(function () {
        window.location.href = 'index.html';
      });
    }
  }
  endGamePlayingBtn.addEventListener('click', endGame);
  endGameFinishedBtn.addEventListener('click', endGame);
  endGameLobbyBtn.addEventListener('click', endGame);

  // New game in same room - resets everything, regenerates boards, keeps players
  newGameBtn.addEventListener('click', function () {
    if (!confirm('Start a fresh game? New songs will be picked and all boards regenerated.')) return;

    var totalRounds = parseInt(newGameRounds.value, 10);
    var newBoardSeed = Math.random().toString(36).substring(2, 10);

    // Pick new random songs from pool
    var newSongs = window.pickSongsForGame();

    // Shuffle new song order
    var numbers = [];
    for (var i = 1; i <= 32; i++) numbers.push(i);
    for (var j = numbers.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = numbers[j];
      numbers[j] = numbers[k];
      numbers[k] = tmp;
    }

    // Update meta for new game
    var updates = {
      'meta/status': 'lobby',
      'meta/currentRound': 1,
      'meta/currentSongIndex': -1,
      'meta/boardSeed': newBoardSeed,
      'meta/totalRounds': totalRounds,
      'meta/winnerName': null,
      'meta/winnerId': null
    };
    updates['songs'] = newSongs;
    updates['songOrder'] = numbers;
    updates['calledSongs'] = [];

    // Regenerate boards for all existing players and reset their state
    var playerKeys = Object.keys(players);
    for (var p = 0; p < playerKeys.length; p++) {
      var pid = playerKeys[p];
      var newBoard = window.generateBoard(newBoardSeed, pid);
      var newMarks = [];
      for (var m = 0; m < 16; m++) newMarks.push(false);
      updates['players/' + pid + '/board'] = newBoard;
      updates['players/' + pid + '/marks'] = newMarks;
      updates['players/' + pid + '/claimedBingo'] = false;
    }

    window.db.ref('games/' + roomCode).update(updates);
  });

  // ===== Celebration =====
  function showCelebration() {
    if (typeof window.launchConfetti === 'function') {
      window.launchConfetti();
    }
  }

})();
