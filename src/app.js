import { createDeck, nextDifficulty, formatTime, scoreRound } from './game.js';

const $ = (selector) => document.querySelector(selector);
const board = $('#game-board');
const message = $('#game-message');
const toast = $('#toast');
const HISTORY_KEY = 'flip-eight-rounds-v1';
const MAX_HISTORY = 8;
let roundNumber = 1;
let difficulty = 'easy';
let cards = [];
let selected = [];
let matched = new Set();
let moves = 0;
let startedAt = null;
let elapsedSeconds = 0;
let clockHandle = null;
let resolveHandle = null;
let roundComplete = false;
let roundSeed = null;
let toastHandle = null;

function readHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((item) => item && Number.isFinite(item.moves) && Number.isFinite(item.seconds)) : [];
  } catch {
    return [];
  }
}
function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY))); }
  catch { showToast('This browser could not save round history.'); }
}
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastHandle);
  toastHandle = setTimeout(() => toast.classList.remove('show'), 2400);
}
function stopTimers() {
  if (clockHandle !== null) clearInterval(clockHandle);
  if (resolveHandle !== null) clearTimeout(resolveHandle);
  clockHandle = null;
  resolveHandle = null;
}
function updateStats() {
  $('#moves-value').textContent = String(moves);
  $('#pairs-value').innerHTML = `${matched.size / 2} <small>/ 8</small>`;
  $('#time-value').textContent = formatTime(elapsedSeconds);
  const count = matched.size / 2;
  $('#progress-bar').style.width = `${count / 8 * 100}%`;
  $('#progress-caption').textContent = count === 8 ? 'All pairs found — lovely work!' : `${8 - count} ${8 - count === 1 ? 'pair' : 'pairs'} left to find`;
}
function startClock() {
  if (clockHandle !== null || roundComplete) return;
  startedAt = Date.now() - elapsedSeconds * 1000;
  clockHandle = setInterval(() => {
    if (startedAt !== null && !roundComplete) {
      elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      $('#time-value').textContent = formatTime(elapsedSeconds);
    }
  }, 250);
}
function makeCard(card, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'memory-card';
  button.dataset.index = String(index);
  button.setAttribute('aria-label', `Card ${index + 1}, face down`);
  button.innerHTML = '<span class="card-face card-back" aria-hidden="true">✳</span><span class="card-face card-front" aria-hidden="true"></span>';
  button.querySelector('.card-front').textContent = card.symbol;
  button.addEventListener('click', () => flipCard(index));
  return button;
}
function renderBoard() {
  board.replaceChildren();
  cards.forEach((card, index) => board.append(makeCard(card, index)));
}
function paintCard(index, state) {
  const element = board.querySelector(`[data-index="${index}"]`);
  if (!element) return;
  const flipped = state === 'flipped' || state === 'matched';
  element.classList.toggle('is-flipped', flipped && state !== 'matched');
  element.classList.toggle('is-matched', state === 'matched');
  element.disabled = state === 'matched' || (selected.length === 2 && state !== 'matched');
  element.setAttribute('aria-label', state === 'matched' ? `Matched ${cards[index].symbol}` : flipped ? `Card showing ${cards[index].symbol}` : `Card ${index + 1}, face down`);
}
function flipCard(index) {
  if (roundComplete || selected.length >= 2 || matched.has(index) || selected.includes(index)) return;
  if (startedAt === null) startClock();
  selected.push(index);
  paintCard(index, 'flipped');
  if (selected.length === 1) {
    message.textContent = 'Now find the card that matches it.';
    return;
  }
  moves += 1;
  updateStats();
  const [first, second] = selected;
  if (cards[first].pairId === cards[second].pairId) {
    matched.add(first); matched.add(second);
    paintCard(first, 'matched'); paintCard(second, 'matched');
    selected = [];
    message.textContent = 'A match! Keep going.';
    updateStats();
    if (matched.size === cards.length) finishRound();
    return;
  }
  message.textContent = 'Not a pair this time. Have another look.';
  board.querySelectorAll('.memory-card').forEach((element) => { element.disabled = true; });
  const mismatchDelay = difficulty === 'hard' ? 420 : 720;
  resolveHandle = setTimeout(() => {
    const [oldFirst, oldSecond] = selected;
    paintCard(oldFirst, 'hidden'); paintCard(oldSecond, 'hidden');
    selected = [];
    resolveHandle = null;
    board.querySelectorAll('.memory-card').forEach((element) => {
      const cardIndex = Number(element.dataset.index);
      element.disabled = matched.has(cardIndex);
    });
    message.textContent = 'Cards turned back over. Try to remember their spots.';
  }, mismatchDelay);
}
function finishRound() {
  roundComplete = true;
  stopTimers();
  elapsedSeconds = startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
  updateStats();
  const result = scoreRound({ moves, seconds: elapsedSeconds, difficulty, seed: roundSeed });
  const history = [result, ...readHistory()].slice(0, MAX_HISTORY);
  saveHistory(history);
  const recommendation = nextDifficulty(result);
  $('#next-difficulty-title').textContent = `${recommendation.difficulty === 'hard' ? 'Hard' : 'Easy'} next`;
  $('#adapt-reason').textContent = recommendation.reason;
  message.textContent = `All eight pairs found in ${moves} moves and ${formatTime(elapsedSeconds)}. Nice work!`;
  showToast('Round complete — your result has been saved on this device.');
  renderHistory();
  $('#restart-button').textContent = '↻ Play again';
  board.querySelectorAll('.memory-card').forEach((element) => { element.disabled = true; });
  difficulty = recommendation.difficulty;
  roundNumber += 1;
}
function startRound({ keepRoundNumber = false } = {}) {
  stopTimers();
  selected = []; matched = new Set(); moves = 0; startedAt = null; elapsedSeconds = 0; roundComplete = false;
  roundSeed = null;
  cards = createDeck({ difficulty });
  if (!keepRoundNumber) roundNumber = 1;
  $('#round-label').firstChild.textContent = `Round ${roundNumber} `;
  const pill = $('#difficulty-label');
  pill.textContent = difficulty === 'hard' ? 'Hard' : 'Easy';
  pill.classList.toggle('hard', difficulty === 'hard');
  $('#next-difficulty-title').textContent = `${difficulty === 'hard' ? 'Hard' : 'Easy'} in play`;
  $('#adapt-reason').textContent = 'Your result will decide whether the next round changes level.';
  $('#restart-button').textContent = '↻ Restart';
  message.textContent = 'Pick any card to get started.';
  updateStats(); renderBoard();
}
function renderHistory() {
  const container = $('#history-list');
  const history = readHistory();
  container.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('p'); empty.className = 'empty-history'; empty.textContent = 'Your completed rounds will appear here.'; container.append(empty); return;
  }
  history.slice(0, 4).forEach((item, index) => {
    const row = document.createElement('div'); row.className = 'history-item';
    const detail = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = `Round ${history.length - index} · ${item.difficulty === 'hard' ? 'Hard' : 'Easy'}`;
    const sub = document.createElement('span'); sub.textContent = `${item.moves} moves · ${formatTime(item.seconds)}`;
    detail.append(title, sub);
    const score = document.createElement('span'); score.className = 'history-score'; score.textContent = `${item.moves} moves`;
    row.append(detail, score); container.append(row);
  });
}
$('#restart-button').addEventListener('click', () => startRound({ keepRoundNumber: true }));
$('#clear-history-button').addEventListener('click', () => { saveHistory([]); renderHistory(); showToast('Recent rounds cleared.'); });
renderHistory();
startRound();
