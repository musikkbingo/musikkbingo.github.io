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

  // Spotify controls
  var spotifyConnectBtn = document.getElementById('spotify-connect-btn');
  var spotifyPlayPause = document.getElementById('spotify-play-pause');
  var spotifyVolume = document.getElementById('spotify-volume');

  // ===== Init =====
  var params = new URLSearchParams(window.location.search);
  roomCode = params.get('room');

  if (!roomCode) {
    authError.textContent = 'No room code provided. Go back to the home page.';
    pinForm.querySelector('button').disabled = true;
    return;
  }

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
    });
    listeners.push({ ref: songsRef, event: 'value' });

    // Song order listener
    var orderRef = gameRef.child('songOrder');
    orderRef.on('value', function (snap) {
      songOrder = snap.val() || [];
    });
    listeners.push({ ref: orderRef, event: 'value' });

    // Called songs listener
    var calledRef = gameRef.child('calledSongs');
    calledRef.on('value', function (snap) {
      var val = snap.val();
      calledSongs = Array.isArray(val) ? val : [];
      renderCalledSongs();
    });
    listeners.push({ ref: calledRef, event: 'value' });

    // Players listener
    var playersRef = gameRef.child('players');
    playersRef.on('value', function (snap) {
      players = snap.val() || {};
      renderPlayerList();
    });
    listeners.push({ ref: playersRef, event: 'value' });

    // Bingo claim listener - watch for child_changed on players
    playersRef.on('child_changed', function (snap) {
      var playerId = snap.key;
      var playerData = snap.val();
      if (playerData && playerData.claimedBingo === true && meta && meta.status === 'playing') {
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
      // Clear Spotify URI when title or artist changes so it gets re-searched
      if (f === 'title' || f === 'artist') {
        songs[idx].spotifyUri = null;
      }
    });
    return input;
  }

  // Save songs - auto-search Spotify for any missing URIs
  saveSongsBtn.addEventListener('click', async function () {
    var token = window.spotifyAPI ? window.spotifyAPI.getToken() : null;

    // Find songs missing Spotify URIs
    var missing = [];
    for (var i = 0; i < songs.length; i++) {
      if (!songs[i].spotifyUri) missing.push(i);
    }

    if (missing.length > 0 && token) {
      saveSongsBtn.disabled = true;
      saveSongsBtn.textContent = 'Searching Spotify... (0/' + missing.length + ')';

      var notFound = [];
      for (var m = 0; m < missing.length; m++) {
        var idx = missing[m];
        var song = songs[idx];
        saveSongsBtn.textContent = 'Searching Spotify... (' + (m + 1) + '/' + missing.length + ')';
        try {
          var query = encodeURIComponent(song.title + ' ' + song.artist);
          var resp = await fetch('https://api.spotify.com/v1/search?q=' + query + '&type=track&limit=1', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          var data = await resp.json();
          if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
            songs[idx].spotifyUri = data.tracks.items[0].uri;
          } else {
            notFound.push(song.title + ' - ' + song.artist);
          }
        } catch (err) {
          notFound.push(song.title + ' - ' + song.artist);
        }
      }

      if (notFound.length > 0) {
        alert('Could not find Spotify tracks for:\n\n' + notFound.join('\n') + '\n\nFix the song titles/artists and save again.');
        saveSongsBtn.disabled = false;
        saveSongsBtn.textContent = 'Save Changes';
        return;
      }
    } else if (missing.length > 0 && !token) {
      alert('Connect to Spotify first so songs can be linked to Spotify tracks.');
      return;
    }

    // All songs have URIs - save to Firebase
    window.db.ref('games/' + roomCode + '/songs').set(songs).then(function () {
      saveSongsBtn.textContent = 'Saved!';
      saveSongsBtn.disabled = false;
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

  // Start game - check all songs have Spotify URIs
  startGameBtn.addEventListener('click', function () {
    var missing = [];
    for (var i = 0; i < songs.length; i++) {
      if (!songs[i].spotifyUri) {
        missing.push('#' + songs[i].number + ' ' + songs[i].title + ' - ' + songs[i].artist);
      }
    }
    if (missing.length > 0) {
      alert('Cannot start! These songs are missing Spotify links:\n\n' + missing.join('\n') + '\n\nConnect Spotify and click "Save Changes" to auto-link them.');
      return;
    }
    window.db.ref('games/' + roomCode + '/meta/status').set('playing');
  });

  // ===== Spotify Controls =====
  var spotifyLobbyConnect = document.getElementById('spotify-lobby-connect-btn');
  var spotifyLobbyStatus = document.getElementById('spotify-lobby-status');

  function connectSpotify() {
    if (window.spotifyAPI) window.spotifyAPI.connect();
  }
  if (spotifyConnectBtn) spotifyConnectBtn.addEventListener('click', connectSpotify);
  if (spotifyLobbyConnect) spotifyLobbyConnect.addEventListener('click', connectSpotify);

  // Sync lobby spotify status with main status
  var spotifyStatusCheck = setInterval(function () {
    if (!window.spotifyAPI) return;
    var connected = window.spotifyAPI.isConnected();
    if (spotifyLobbyStatus) {
      spotifyLobbyStatus.textContent = connected ? '🟢 Connected' : '🔴 Not connected';
      spotifyLobbyStatus.style.color = connected ? 'var(--success)' : 'var(--text-muted)';
    }
    if (connected) {
      if (spotifyLobbyConnect) spotifyLobbyConnect.classList.add('hidden');
      clearInterval(spotifyStatusCheck);
    }
  }, 1000);
  if (spotifyPlayPause) {
    spotifyPlayPause.addEventListener('click', function () {
      if (window.spotifyAPI) window.spotifyAPI.togglePlay();
    });
  }
  if (spotifyVolume) {
    spotifyVolume.addEventListener('input', function () {
      if (window.spotifyAPI) window.spotifyAPI.setVolume(parseInt(this.value, 10) / 100);
    });
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
        var pl = players[keys[j]];
        var li2 = document.createElement('li');
        var nameSpan2 = document.createElement('span');
        nameSpan2.className = 'player-name';
        nameSpan2.textContent = pl.name;
        var statusSpan2 = document.createElement('span');
        if (pl.claimedBingo) {
          statusSpan2.className = 'player-status bingo-claimed';
          statusSpan2.textContent = 'BINGO claimed!';
        } else {
          statusSpan2.className = 'player-status';
          statusSpan2.textContent = 'Playing';
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
    if (currentIndex === -1 || !songOrder || songOrder.length === 0) {
      currentSongNumber.textContent = '-';
      currentSongTitle.textContent = 'Ready to start';
      currentSongArtist.textContent = 'Press "Next Song" to begin';
    } else {
      var songNum = songOrder[currentIndex];
      var song = findSongByNumber(songNum);
      currentSongNumber.textContent = songNum;
      currentSongTitle.textContent = song ? song.title : 'Song #' + songNum;
      currentSongArtist.textContent = song ? song.artist : '';
    }

    // Disable next song if all songs called
    nextSongBtn.disabled = (currentIndex >= 31);

    renderCalledSongs();
  }

  function findSongByNumber(num) {
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].number === num) return songs[i];
    }
    return null;
  }

  // Next song
  nextSongBtn.addEventListener('click', function () {
    if (!meta) return;
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

    // Auto-play via Spotify if connected
    if (window.spotifyAPI && window.spotifyAPI.isConnected()) {
      var song = findSongByNumber(songNum);
      if (song && song.spotifyUri) {
        window.spotifyAPI.play(song.spotifyUri);
      }
    }
  });

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
    // Fresh read of calledSongs to avoid race condition
    window.db.ref('games/' + roomCode + '/calledSongs').once('value', function (snap) {
      var freshCalled = snap.val();
      freshCalled = Array.isArray(freshCalled) ? freshCalled : [];

      var board = playerData.board || [];
      var marks = playerData.marks || [];
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
    var updates = {
      'meta/currentRound': newRound,
      'meta/currentSongIndex': meta.currentSongIndex, // keep current position
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
    if (!confirm('Start a fresh game? All boards will be regenerated and scores reset.')) return;

    var totalRounds = parseInt(newGameRounds.value, 10);
    var newBoardSeed = Math.random().toString(36).substring(2, 10);

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
