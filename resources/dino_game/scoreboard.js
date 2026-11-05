const SCOREBOARD_KEY = 'revengeScoreboard';

/**
 * @param {string} raw
 * @return {string|null} 3-letter A–Z nick or null
 */
export function normalizeNick(raw) {
  const nick = String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  return nick.length === 3 ? nick : null;
}

function readAll() {
  try {
    const raw = localStorage.getItem(SCOREBOARD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(list));
  } catch (e) {
    /* ignore */
  }
}

/**
 * Sort: lower time, then lower escape%, then lower bones.
 * @param {Array<Object>} list
 * @return {Array<Object>}
 */
export function sortScores(list) {
  return list.slice().sort((a, b) => {
    const t = (a.elapsedMs || 0) - (b.elapsedMs || 0);
    if (t !== 0) return t;
    const e = (a.escapePct || 0) - (b.escapePct || 0);
    if (e !== 0) return e;
    return (a.bonesSpent || 0) - (b.bonesSpent || 0);
  });
}

/** @return {Array<Object>} */
export function listScores() {
  return sortScores(readAll());
}

/**
 * Insert nick or update only when time improves.
 * @param {Object} entry
 * @return {{ok: boolean, reason: string}}
 */
export function submitScore(entry) {
  const nick = normalizeNick(entry && entry.nick);
  if (!nick) {
    return { ok: false, reason: 'invalid' };
  }
  const elapsedMs = Number(entry.elapsedMs) || 0;
  if (elapsedMs <= 0) {
    return { ok: false, reason: 'invalid' };
  }

  const next = {
    nick,
    escapePct: Math.min(100, Math.max(0, Math.floor(entry.escapePct || 0))),
    elapsedMs,
    bonesSpent: Math.max(0, Math.floor(entry.bonesSpent || 0)),
    updatedAt: Date.now(),
  };

  const list = readAll();
  const idx = list.findIndex((row) => row.nick === nick);
  if (idx < 0) {
    list.push(next);
    writeAll(list);
    return { ok: true, reason: 'created' };
  }

  const prev = list[idx];
  if (elapsedMs < (prev.elapsedMs || Infinity)) {
    list[idx] = next;
    writeAll(list);
    return { ok: true, reason: 'improved' };
  }

  return { ok: false, reason: 'not_better' };
}
