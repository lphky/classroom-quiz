import { createState, normalizeState } from './logic.mjs';

const KEY = 'classroom-quiz:state';
const UNDO_KEY = 'classroom-quiz:undo';
const UNDO_MAX = 30;

export function load() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return createState();
  }
}

export function loadUndo() {
  try {
    const u = JSON.parse(localStorage.getItem(UNDO_KEY));
    return Array.isArray(u) ? u : [];
  } catch {
    return [];
  }
}

export function save(state, undo) {
  localStorage.setItem(KEY, JSON.stringify(state));
  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify(undo.slice(-UNDO_MAX)));
  } catch {
    localStorage.setItem(UNDO_KEY, JSON.stringify(undo.slice(-5)));
  }
}

export { UNDO_MAX };
