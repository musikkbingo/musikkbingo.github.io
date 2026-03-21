// Player board logic for Music Bingo
// Requires: firebase-config.js, songs.js, board.js, bingo-check.js, game.js

(function () {
  'use strict';

  // ---- Read URL params ----
  var params = new URLSearchParams(window.location.search);
  var roomCode = params.get('room');
  var playerId = params.get('player');

  if (!roomCode || !playerId) {
    alert('Missing room code or player ID. Returning to home.');
    window.location.href = 'index.html';
    return;
  }

  // ---- Firebase refs ----
  var gameRef = window.db.ref('games/' + roomCode);
  var playerRef = gameRef.child('players/' + playerId);
  var metaRef = gameRef.child('meta');
  var calledSongsRef = gameRef.child('calledSongs');
  var songsRef = gameRef.child('songs');

  // ---- Local state ----
  var playerName = '';
  var board = [];          // 16 song numbers
  var marks = [];          // 16 booleans
  var songs = [];          // all 32 songs
  var calledSongs = [];    // called song numbers
  var meta = {};           // game meta
  var songMap = {};        // number -> song object
  var lastClaimedBingo = false;
  var celebrationShown = false;

  // ---- DOM refs ----
  var roomCodeDisplay = document.getElementById('room-code-display');
  var playerNameDisplay = document.getElementById('player-name-display');
  var roundInfo = document.getElementById('round-info');
  var roundRequirement = document.getElementById('round-requirement');
  var boardEl = document.getElementById('bingo-board');
  var bingoBtn = document.getElementById('bingo-btn');
  var toastMsg = document.getElementById('toast-msg');
  var songListEl = document.getElementById('song-list');
  var celebrationOverlay = document.getElementById('celebration-overlay');
  var celebrationTitle = document.getElementById('celebration-title');
  var celebrationWinner = document.getElementById('celebration-winner');
  var celebrationSubtitle = document.getElementById('celebration-subtitle');
  var celebrationDismiss = document.getElementById('celebration-dismiss');

  // ---- Display room code ----
  roomCodeDisplay.textContent = 'BINGO-' + roomCode;

  // ---- Toast helper ----
  var toastTimer = null;
  function showToast(msg, color, duration) {
    duration = duration || 2500;
    toastMsg.textContent = msg;
    toastMsg.style.background = color || 'var(--accent-secondary)';
    toastMsg.style.color = '#fff';
    toastMsg.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastMsg.classList.add('hidden');
    }, duration);
  }

  // ---- Round display ----
  function updateRoundDisplay() {
    var round = meta.currentRound || 1;
    roundInfo.textContent = 'Round ' + round;
    var reqTexts = {
      1: '🎯 One line to win!',
      2: '🎯 Two lines to win!',
      3: '🎯 Full board to win!'
    };
    roundRequirement.textContent = reqTexts[round] || '';
    updateBingoButton();
  }

  // ---- Song tracking (no audio on player - music plays from venue speakers) ----
  var lastPlayedSongIndex = -1;

  // ---- Build song map ----
  function buildSongMap() {
    songMap = {};
    for (var i = 0; i < songs.length; i++) {
      songMap[songs[i].number] = songs[i];
    }
  }

  // ---- Render Bingo Board ----
  var boardBuilt = false;

  function renderBoard(forceRebuild) {
    // First render or forced rebuild: build all cells
    if (!boardBuilt || forceRebuild || boardEl.children.length !== 16) {
      boardBuilt = false;
      boardEl.innerHTML = '';
      for (var i = 0; i < 16; i++) {
        var cell = document.createElement('div');
        cell.className = 'bingo-cell';
        cell.dataset.index = i;

        var songNum = board[i];

        var numSpan = document.createElement('span');
        numSpan.className = 'song-number';
        numSpan.textContent = songNum;
        cell.appendChild(numSpan);

        var song = songMap[songNum];
        if (song) {
          var titleSpan = document.createElement('span');
          titleSpan.className = 'song-title';
          titleSpan.textContent = song.title;
          cell.appendChild(titleSpan);
        }

        cell.addEventListener('click', (function (idx) {
          return function () { toggleMark(idx); };
        })(i));

        boardEl.appendChild(cell);
      }
      boardBuilt = true;
    }

    // Update marks without rebuilding (no flicker)
    for (var j = 0; j < 16; j++) {
      var el = boardEl.children[j];
      if (!el) continue;
      var wasMarked = el.classList.contains('marked');
      var isMarked = marks[j] === true;
      if (isMarked && !wasMarked) {
        el.classList.add('marked');
      } else if (!isMarked && wasMarked) {
        el.classList.remove('marked');
      }
    }
  }

  // ---- Check if marks form a bingo pattern (ignoring whether songs are correct) ----
  function hasPatternForRound(round) {
    round = parseInt(round, 10) || 1;
    if (round === 3) {
      for (var k = 0; k < 16; k++) { if (!marks[k]) return false; }
      return true;
    }
    var lines = window.WINNING_LINES;
    var completedLines = 0;
    for (var l = 0; l < lines.length; l++) {
      var complete = true;
      for (var j = 0; j < lines[l].length; j++) {
        if (!marks[lines[l][j]]) { complete = false; break; }
      }
      if (complete) completedLines++;
    }
    if (round === 1) return completedLines >= 1;
    return completedLines >= 2;
  }

  function updateBingoButton() {
    var round = (meta && meta.currentRound) ? parseInt(meta.currentRound, 10) : 1;
    var ready = hasPatternForRound(round);
    bingoBtn.disabled = !ready;
    if (ready) {
      bingoBtn.classList.add('bingo-ready');
      bingoBtn.textContent = '🎉 BINGO! 🎉';
    } else {
      bingoBtn.classList.remove('bingo-ready');
      bingoBtn.textContent = 'BINGO';
    }
  }

  // ---- Toggle mark ----
  function toggleMark(idx) {
    marks[idx] = !marks[idx];
    playerRef.child('marks').set(marks);
    renderBoard();
    updateBingoButton();
  }

  // ---- Render Song List ----
  function renderSongList() {
    songListEl.innerHTML = '';

    // Group by category
    var categories = {};
    var categoryOrder = [];
    for (var i = 0; i < songs.length; i++) {
      var cat = songs[i].category;
      if (!categories[cat]) {
        categories[cat] = [];
        categoryOrder.push(cat);
      }
      categories[cat].push(songs[i]);
    }

    for (var c = 0; c < categoryOrder.length; c++) {
      var catName = categoryOrder[c];
      var catSongs = categories[catName];

      var catDiv = document.createElement('div');
      catDiv.className = 'song-category';

      var categoryEmojis = {
        'Norske sanger': '🇳🇴',
        'Dansegulvet': '🪩',
        'Kjærleik': '💕',
        'Tidenes hits': '🔥'
      };
      var catTitle = document.createElement('h3');
      var emojiSpan = document.createElement('span');
      emojiSpan.className = 'category-emoji';
      emojiSpan.textContent = categoryEmojis[catName] || '🎵';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'category-name';
      nameSpan.textContent = ' ' + catName;
      catTitle.appendChild(emojiSpan);
      catTitle.appendChild(nameSpan);
      catDiv.appendChild(catTitle);

      var ul = document.createElement('ul');
      for (var s = 0; s < catSongs.length; s++) {
        var song = catSongs[s];
        var li = document.createElement('li');

        var numSpan = document.createElement('span');
        numSpan.className = 'song-num';
        numSpan.textContent = song.number;

        li.appendChild(numSpan);
        li.appendChild(document.createTextNode(' ' + song.title + ' - ' + song.artist));

        ul.appendChild(li);
      }

      catDiv.appendChild(ul);
      songListEl.appendChild(catDiv);
    }
  }

  // ---- BINGO button ----
  var wrongMessages = [
    '😬 Nope! Listen closer!',
    '🙈 Not quite there...',
    '🎵 Nice try, keep listening!',
    '😅 Oops! Wrong songs marked!',
    '🤔 Are you sure about those?',
    '🫣 Almost... but not this time!',
    '🎧 Turn up the volume maybe?',
    '😂 Bold move! But no...',
    '🤷 Better luck next song!',
    '💃 Keep dancing, keep guessing!'
  ];

  bingoBtn.addEventListener('click', function () {
    if (bingoBtn.disabled) return;

    // Pre-check: marks form a pattern, but are the right songs called?
    var hasBingo = window.checkBingo(board, marks, calledSongs, meta.currentRound || 1);

    if (!hasBingo) {
      var msg = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
      showToast(msg, 'var(--danger)', 3000);
      // Shake animation
      bingoBtn.style.animation = 'none';
      bingoBtn.offsetHeight; // force reflow
      bingoBtn.style.animation = 'shake 0.5s ease';
      return;
    }

    // Claim bingo in Firebase
    bingoBtn.disabled = true;
    bingoBtn.textContent = 'Checking...';
    playerRef.child('claimedBingo').set(true);
    showToast('Checking...', 'var(--warning)', 10000);
  });

  // ---- Winner celebration ----
  function showCelebration(winnerName, winnerId) {
    if (celebrationShown) return;
    celebrationShown = true;

    var isMe = winnerId === playerId;
    var isLastRound = (meta.currentRound || 1) >= (meta.totalRounds || 3);

    if (isMe) {
      celebrationTitle.textContent = '🎉 YOU WON! 🎉';
      celebrationWinner.textContent = playerName;
      celebrationSubtitle.textContent = isLastRound ? 'You won the final round!' : 'Congratulations!';
    } else {
      celebrationTitle.textContent = '🎵 BINGO! 🎵';
      celebrationWinner.textContent = winnerName + ' got BINGO!';
      celebrationSubtitle.textContent = isLastRound ? 'Game over! Final round complete.' : 'Next round coming up...';
    }

    if (isLastRound) {
      celebrationDismiss.textContent = 'Waiting for new game...';
      celebrationDismiss.disabled = true;
      bingoBtn.disabled = true;
      bingoBtn.textContent = 'Game Over';
    } else {
      celebrationDismiss.textContent = 'Continue';
      celebrationDismiss.disabled = false;
    }

    celebrationOverlay.classList.add('active');

    if (typeof window.launchConfetti === 'function') {
      window.launchConfetti();
    }
  }

  celebrationDismiss.addEventListener('click', function () {
    if (celebrationDismiss.disabled) return;
    celebrationOverlay.classList.remove('active');
    celebrationShown = false;
    bingoBtn.disabled = false;
    bingoBtn.textContent = 'BINGO!';
  });

  // ---- Initialize: load player data ----
  playerRef.once('value', function (snap) {
    if (!snap.exists()) {
      alert('Player not found in this room. Returning to home.');
      window.location.href = 'index.html';
      return;
    }

    var data = snap.val();
    playerName = data.name || 'Player';
    board = data.board || [];
    marks = data.marks || [];
    lastClaimedBingo = data.claimedBingo || false;

    // Ensure marks is an array of 16
    if (!Array.isArray(marks) || marks.length < 16) {
      marks = [];
      for (var i = 0; i < 16; i++) {
        marks.push(false);
      }
    }

    playerNameDisplay.textContent = playerName;

    // Load songs
    songsRef.once('value', function (songSnap) {
      songs = songSnap.val() || window.DEFAULT_SONGS;
      buildSongMap();

      // Load meta
      metaRef.once('value', function (metaSnap) {
        meta = metaSnap.val() || {};
        updateRoundDisplay();

        // Load called songs
        calledSongsRef.once('value', function (calledSnap) {
          calledSongs = calledSnap.val() || [];
          if (!Array.isArray(calledSongs)) calledSongs = [];

          renderBoard();
          renderSongList();
          updateBingoButton();

          // Now set up real-time listeners
          setupListeners();
        });
      });
    });
  });

  // ---- Real-time listeners ----
  function setupListeners() {
    // Listen for called songs changes
    calledSongsRef.on('value', function (snap) {
      calledSongs = snap.val() || [];
      if (!Array.isArray(calledSongs)) calledSongs = [];
      renderBoard();
      updateBingoButton();
    });

    // Listen for meta changes
    metaRef.on('value', function (snap) {
      var newMeta = snap.val() || {};
      var oldStatus = meta.status;
      var oldRound = meta.currentRound;
      var oldSongIndex = meta.currentSongIndex;

      meta = newMeta;
      updateRoundDisplay();

      // New song notification
      var newIdx = newMeta.currentSongIndex;
      if (newIdx !== undefined && newIdx !== null && newIdx !== -1 && newIdx !== lastPlayedSongIndex && newMeta.status === 'playing') {
        lastPlayedSongIndex = newIdx;
        var songNum = (newIdx + 1);
        showToast('🎵 Song ' + songNum + ' of 32 — listen up!', 'var(--accent-secondary)', 3000);
        // Flash the board border
        var boardEl = document.getElementById('bingo-board');
        if (boardEl) {
          boardEl.style.borderColor = 'var(--accent)';
          boardEl.style.boxShadow = '0 0 20px rgba(255, 45, 117, 0.4)';
          setTimeout(function () {
            boardEl.style.borderColor = '';
            boardEl.style.boxShadow = '';
          }, 2000);
        }
      } else if (newIdx !== lastPlayedSongIndex) {
        lastPlayedSongIndex = newIdx;
      }

      // Detect status change to "finished"
      if (newMeta.status === 'finished' && oldStatus !== 'finished') {
        showCelebration(newMeta.winnerName || 'Someone', newMeta.winnerId || '');
      }

      // Detect game ended/deleted (meta becomes empty)
      if (!newMeta.status && oldStatus) {
        celebrationTitle.textContent = 'Game Over';
        celebrationWinner.textContent = 'Thanks for playing!';
        celebrationSubtitle.textContent = '';
        celebrationOverlay.classList.add('active');
        celebrationDismiss.textContent = 'Back to Home';
        celebrationDismiss.disabled = false;
        celebrationDismiss.onclick = function () { window.location.href = 'index.html'; };
      }

      // Detect round increase while playing — dismiss celebration, reload state
      if (newMeta.status === 'playing' && newMeta.currentRound > (oldRound || 1)) {
        celebrationOverlay.classList.remove('active');
        celebrationShown = false;
        celebrationDismiss.disabled = false;
        celebrationDismiss.textContent = 'Continue';
        bingoBtn.disabled = true;
        bingoBtn.textContent = 'BINGO';
        bingoBtn.classList.remove('bingo-ready');
        showToast('🎯 Round ' + newMeta.currentRound + ' starting!', 'var(--accent-secondary)', 3000);
        // Re-read marks and calledSongs from Firebase to ensure fresh state
        playerRef.child('marks').once('value', function (msnap) {
          marks = msnap.val() || marks;
          if (!Array.isArray(marks)) { marks = []; for (var i = 0; i < 16; i++) marks.push(false); }
          renderBoard();
          calledSongsRef.once('value', function (csnap) {
            calledSongs = csnap.val() || [];
            if (!Array.isArray(calledSongs)) calledSongs = [];
            updateBingoButton();
          });
        });
      }

      // Detect new game started (admin restarted in same room)
      if (newMeta.status === 'lobby' && oldStatus && oldStatus !== 'lobby') {
        celebrationOverlay.classList.remove('active');
        celebrationShown = false;
        celebrationDismiss.disabled = false;
        celebrationDismiss.textContent = 'Continue';
        bingoBtn.disabled = false;
        bingoBtn.textContent = 'BINGO!';
        showToast('🎵 New game starting! Board updated.', 'var(--accent-secondary)', 4000);
        // Reload player data, songs, and called songs (all regenerated by admin)
        songsRef.once('value', function (songSnap) {
          songs = songSnap.val() || [];
          buildSongMap();
          renderSongList();

          playerRef.once('value', function (psnap) {
            if (psnap.exists()) {
              var d = psnap.val();
              board = d.board || [];
              marks = d.marks || [];
              renderBoard(true);
            }
          });
        });
      }

      // Detect game going from lobby to playing — reload songs in case admin edited them
      if (newMeta.status === 'playing' && oldStatus === 'lobby') {
        showToast('🎶 Game started! Listen for songs!', 'var(--success)', 3000);
        songsRef.once('value', function (songSnap) {
          songs = songSnap.val() || [];
          buildSongMap();
          renderSongList();
          renderBoard(true);
        });
      }
    });

    // Listen for claimedBingo being reset (wrong claim)
    playerRef.child('claimedBingo').on('value', function (snap) {
      var claimed = snap.val();
      if (lastClaimedBingo === true && claimed === false) {
        // Bingo was rejected
        showToast('Not this time!', 'var(--danger)', 3000);
        bingoBtn.disabled = false;
        bingoBtn.textContent = 'BINGO!';
      }
      lastClaimedBingo = claimed;
    });
  }
})();
