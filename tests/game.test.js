import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, seededRandom, shuffle, nextDifficulty, formatTime, scoreRound } from '../src/game.js';

test('deck contains eight pairs and sixteen unique card IDs', () => {
  const deck = createDeck({ seed: 42 });
  assert.equal(deck.length, 16);
  assert.equal(new Set(deck.map((card) => card.id)).size, 16);
  assert.equal(new Set(deck.map((card) => card.pairId)).size, 8);
  for (let pair = 0; pair < 8; pair += 1) assert.equal(deck.filter((card) => card.pairId === pair).length, 2);
});

test('seeded deck is reproducible', () => {
  assert.deepEqual(createDeck({ seed: 2026 }), createDeck({ seed: 2026 }));
  assert.notDeepEqual(createDeck({ seed: 2026 }), createDeck({ seed: 2027 }));
});

test('shuffle keeps all original values', () => {
  const values = [1, 2, 3, 4, 5];
  const shuffled = shuffle(values, seededRandom(7));
  assert.deepEqual([...shuffled].sort(), values);
  assert.deepEqual(values, [1, 2, 3, 4, 5]);
});

test('strong performance recommends hard mode', () => {
  assert.equal(nextDifficulty({ moves: 12, seconds: 45, difficulty: 'easy' }).difficulty, 'hard');
});

test('a long or high-move round recommends easy mode', () => {
  assert.equal(nextDifficulty({ moves: 22, seconds: 80, difficulty: 'hard' }).difficulty, 'easy');
  assert.equal(nextDifficulty({ moves: 18, seconds: 101, difficulty: 'hard' }).difficulty, 'easy');
});

test('middle performance keeps the current level', () => {
  assert.equal(nextDifficulty({ moves: 16, seconds: 70, difficulty: 'hard' }).difficulty, 'hard');
  assert.equal(nextDifficulty({ moves: 16, seconds: 70, difficulty: 'easy' }).difficulty, 'easy');
});

test('time formatting handles seconds and minutes', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(9), '00:09');
  assert.equal(formatTime(125), '02:05');
  assert.equal(formatTime(-2), '00:00');
});

test('score result accepts valid values and rejects invalid input', () => {
  const result = scoreRound({ moves: 8, seconds: 37.8, difficulty: 'easy', seed: 3 });
  assert.equal(result.moves, 8);
  assert.equal(result.seconds, 37);
  assert.equal(result.seed, 3);
  assert.throws(() => scoreRound({ moves: 0, seconds: 2, difficulty: 'easy' }), /Moves/);
  assert.throws(() => scoreRound({ moves: 2, seconds: -1, difficulty: 'easy' }), /Seconds/);
  assert.throws(() => scoreRound({ moves: 2, seconds: 1, difficulty: 'expert' }), /Difficulty/);
});
