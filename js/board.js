// Board generation with seeded PRNG for deterministic player boards

/**
 * Mulberry32 - a simple seeded 32-bit PRNG.
 * Returns a function that produces pseudo-random numbers in [0, 1).
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using a seeded PRNG function.
 * Shuffles the array in place and returns it.
 */
function seededShuffle(array, rng) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Hash a string into a 32-bit integer seed.
 */
function hashString(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

/**
 * Generate a deterministic 4x4 bingo board (16 cells) for a player.
 * @param {string} seed - The game/room seed.
 * @param {string} playerId - The player's unique ID.
 * @returns {number[]} Array of 16 song numbers (from 1-32).
 */
function generateBoard(seed, playerId) {
  var combinedSeed = hashString(String(seed) + String(playerId));
  var rng = mulberry32(combinedSeed);

  // Create array of numbers 1-32
  var numbers = [];
  for (var i = 1; i <= 32; i++) {
    numbers.push(i);
  }

  // Shuffle and take first 16
  seededShuffle(numbers, rng);
  return numbers.slice(0, 16);
}

window.generateBoard = generateBoard;
