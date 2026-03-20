// Room/game management for Music Bingo
// Requires: firebase-config.js (window.db), songs.js (window.DEFAULT_SONGS), board.js (window.generateBoard)

/**
 * Generate a 4-character alphanumeric room code.
 * Excludes ambiguous characters: 0, O, 1, I, L.
 * Display format: BINGO-XXXX (stored as just XXXX).
 * @returns {string} 4-character code
 */
function generateRoomCode() {
  var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Hash a PIN string using SHA-256 via Web Crypto API.
 * @param {string} pin
 * @returns {Promise<string>} Hex-encoded hash
 */
async function hashPin(pin) {
  var encoder = new TextEncoder();
  var data = encoder.encode(pin);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

/**
 * Shuffle an array in place using Fisher-Yates.
 * @param {Array} arr
 * @returns {Array}
 */
function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Create a new game room in Firebase.
 * @param {string} pin - Admin PIN (4+ digits)
 * @param {number} totalRounds - Number of rounds (1, 2, or 3)
 * @returns {Promise<string>} The generated room code
 */
async function createGame(pin, totalRounds) {
  var roomCode = generateRoomCode();
  var adminPinHash = await hashPin(pin);
  var boardSeed = Math.random().toString(36).substring(2, 10);

  // Shuffle song numbers 1-32 for songOrder
  var songNumbers = [];
  for (var i = 1; i <= 32; i++) {
    songNumbers.push(i);
  }
  var songOrder = shuffleArray(songNumbers.slice());

  var gameRef = window.db.ref('games/' + roomCode);

  await gameRef.child('meta').set({
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    adminPinHash: adminPinHash,
    status: 'lobby',
    currentRound: 1,
    currentSongIndex: -1,
    boardSeed: boardSeed,
    totalRounds: totalRounds
  });

  await gameRef.child('songs').set(window.DEFAULT_SONGS);
  await gameRef.child('songOrder').set(songOrder);
  await gameRef.child('calledSongs').set([]);

  return roomCode;
}

/**
 * Join an existing game room.
 * @param {string} roomCode - 4-character room code
 * @param {string} playerName - Player display name
 * @returns {Promise<{playerId: string, board: number[]}>}
 */
async function joinGame(roomCode, playerName) {
  var metaSnap = await window.db.ref('games/' + roomCode + '/meta').once('value');
  if (!metaSnap.exists()) {
    throw new Error('Room not found. Check the code and try again.');
  }

  var meta = metaSnap.val();
  if (meta.status !== 'lobby') {
    throw new Error('Game has already started. You cannot join mid-game.');
  }
  var boardSeed = meta.boardSeed;

  // Generate unique player ID
  var playerRef = window.db.ref('games/' + roomCode + '/players').push();
  var playerId = playerRef.key;

  // Generate deterministic board
  var board = window.generateBoard(boardSeed, playerId);

  // Create marks array (16 false values)
  var marks = [];
  for (var i = 0; i < 16; i++) {
    marks.push(false);
  }

  await playerRef.set({
    name: playerName,
    joinedAt: firebase.database.ServerValue.TIMESTAMP,
    board: board,
    marks: marks,
    claimedBingo: false
  });

  return { playerId: playerId, board: board };
}

/**
 * Verify admin credentials for a game room.
 * @param {string} roomCode - 4-character room code
 * @param {string} pin - PIN to verify
 * @returns {Promise<boolean>}
 */
async function verifyAdmin(roomCode, pin) {
  var metaSnap = await window.db.ref('games/' + roomCode + '/meta').once('value');
  if (!metaSnap.exists()) {
    return false;
  }

  var storedHash = metaSnap.val().adminPinHash;
  var providedHash = await hashPin(pin);
  return storedHash === providedHash;
}

// Export all functions on window
window.generateRoomCode = generateRoomCode;
window.hashPin = hashPin;
window.createGame = createGame;
window.joinGame = joinGame;
window.verifyAdmin = verifyAdmin;
