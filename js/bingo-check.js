// Bingo win-condition checking for rounds 1, 2, and 3

/**
 * All winning lines on a 4x4 grid (indices 0-15).
 * 4 rows + 4 columns + 2 diagonals = 10 lines.
 */
window.WINNING_LINES = [
  // Rows
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  // Columns
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  // Diagonals
  [0, 5, 10, 15],
  [3, 6, 9, 12]
];

/**
 * Check if a player has achieved bingo for the current round.
 *
 * @param {number[]} board - Array of 16 song numbers on the player's board.
 * @param {boolean[]} marks - Array of 16 booleans representing the player's marks.
 * @param {number[]} calledSongs - Array of song numbers that have been called.
 * @param {number} currentRound - The current round (1, 2, or 3).
 * @returns {boolean} True if the player has achieved bingo for the round.
 */
function checkBingo(board, marks, calledSongs, currentRound) {
  // Build a set of called songs for fast lookup
  var calledSet = {};
  for (var c = 0; c < calledSongs.length; c++) {
    calledSet[calledSongs[c]] = true;
  }

  // A cell is valid if the player marked it AND the song was actually called
  var valid = [];
  for (var i = 0; i < 16; i++) {
    valid[i] = marks[i] === true && calledSet[board[i]] === true;
  }

  // Round 3: full board - all 16 cells must be valid
  if (currentRound === 3) {
    for (var k = 0; k < 16; k++) {
      if (!valid[k]) {
        return false;
      }
    }
    return true;
  }

  // Rounds 1 and 2: count completed lines
  var completedLines = 0;
  for (var l = 0; l < window.WINNING_LINES.length; l++) {
    var line = window.WINNING_LINES[l];
    var complete = true;
    for (var j = 0; j < line.length; j++) {
      if (!valid[line[j]]) {
        complete = false;
        break;
      }
    }
    if (complete) {
      completedLines++;
    }
  }

  if (currentRound === 1) {
    return completedLines >= 1;
  }
  // currentRound === 2
  return completedLines >= 2;
}

window.checkBingo = checkBingo;
