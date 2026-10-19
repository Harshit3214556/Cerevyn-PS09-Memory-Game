export const PAIRS = 8;
export const SYMBOLS = ['🍋', '🪴', '🍓', '🌙', '🧩', '🍄', '☀️', '🐚', '🦋', '🌼', '🎈', '🍉'];

export function seededRandom(seed = 1) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function createDeck({ seed, difficulty = 'easy' } = {}) {
  const pairCount = difficulty === 'hard' ? 8 : PAIRS;
  const symbols = SYMBOLS.slice(0, pairCount);
  const cards = symbols.flatMap((symbol, index) => [
    { id: `${index}-a`, pairId: index, symbol },
    { id: `${index}-b`, pairId: index, symbol }
  ]);
  const random = seed === undefined ? Math.random : seededRandom(seed);
  return shuffle(cards, random);
}

export function nextDifficulty(result) {
  if (!result || !Number.isFinite(result.moves) || !Number.isFinite(result.seconds)) {
    return { difficulty: 'easy', reason: 'A new round starts on Easy.' };
  }
  if (result.moves <= 12 && result.seconds <= 45) {
    return { difficulty: 'hard', reason: 'You found every pair in 12 moves or fewer and within 45 seconds. Try a tougher round.' };
  }
  if (result.moves >= 22 || result.seconds > 100) {
    return { difficulty: 'easy', reason: 'This round took 22 or more moves, or over 100 seconds. Easy gives you room to build your rhythm.' };
  }
  return { difficulty: result.difficulty === 'hard' ? 'hard' : 'easy', reason: 'You landed in the middle range, so the next round keeps the same level.' };
}

export function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function scoreRound({ moves, seconds, difficulty, seed }) {
  if (!Number.isInteger(moves) || moves < 1) throw new Error('Moves must be a positive whole number.');
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Seconds must be a non-negative number.');
  if (!['easy', 'hard'].includes(difficulty)) throw new Error('Difficulty must be easy or hard.');
  return { moves, seconds: Math.floor(seconds), difficulty, seed: seed ?? null, completedAt: new Date().toISOString() };
}
