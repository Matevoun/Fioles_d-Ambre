/*
 * Regle : Fioles d'Ambre
 * La regle, les niveaux, l'indice. Pas de dessin ici.
 * ©2026, Mathieu CHARREYRE pour WDA & Ambre.
 * Avant une modification : Lire JS/doctrine.js
 */

const CAPACITY = 4;
const MELASSES = [
  { name: "Ambre", fill: "#e39b2b", deep: "#8a5410", light: "#ffd27a" },
  { name: "Grenat", fill: "#c4375a", deep: "#6e1830", light: "#ff9ab4" },
  { name: "Emeraude", fill: "#1f9a6c", deep: "#0c5a3e", light: "#8ef0c8" },
  { name: "Indigo", fill: "#3d4ad4", deep: "#1e267f", light: "#aeb6ff" },
  { name: "Orchidee", fill: "#c43b93", deep: "#721c54", light: "#ffb0de" },
  { name: "Lagon", fill: "#1aa3b5", deep: "#0b616c", light: "#9af0f8" },
  { name: "Absinthe", fill: "#a3c43a", deep: "#5c7014", light: "#e7f7a4" },
  { name: "Violette", fill: "#7a3bb8", deep: "#451c70", light: "#d7b4ff" },
  { name: "Corail", fill: "#e56a3c", deep: "#9a3814", light: "#ffc0a4" },
  { name: "Bleuet", fill: "#3a78e0", deep: "#1a448f", light: "#b7d2ff" },
  { name: "Prune", fill: "#8a3d5b", deep: "#4e2032", light: "#e7b0c4" },
  { name: "Safran", fill: "#e2c14a", deep: "#8f7410", light: "#fff1b0" }
];
// Apres le 40, la courbe monte encore. Au 59 elle s'arrete : 12 couleurs, pas une de plus.
function specFor(level) {
  const n = Math.max(1, Math.floor(level));
  if (n === 1) return { colors: 3, empties: 2, hidden: false, scramble: 3 };
  if (n === 2) return { colors: 3, empties: 2, hidden: false, scramble: 5 };
  if (n === 3) return { colors: 3, empties: 2, hidden: false, scramble: 8 };
  if (n <= 6) return { colors: 4, empties: 2, hidden: false, scramble: 10 + (n - 4) * 3 };
  if (n <= 10) return { colors: 5, empties: 2, hidden: false, scramble: 12 + (n - 7) * 2 };
  if (n <= 14) return { colors: 5, empties: 1, hidden: false, scramble: 10 + (n - 11) };
  if (n <= 18) return { colors: 6, empties: 2, hidden: false, scramble: 14 + (n - 15) * 2 };
  if (n <= 22) return { colors: 6, empties: 1, hidden: false, scramble: 12 + (n - 19) * 2 };
  if (n <= 26) return { colors: 7, empties: 2, hidden: true, scramble: 16 + (n - 23) * 2 };
  if (n <= 30) return { colors: 7, empties: 1, hidden: true, scramble: 14 + (n - 27) * 2 };
  if (n <= 34) return { colors: 8, empties: 2, hidden: true, scramble: 18 + (n - 31) * 2 };
  if (n <= 40) return { colors: 8, empties: 1, hidden: true, scramble: 16 + Math.floor((n - 35) * 1.2) };
  const extra = Math.min(3, Math.floor((n - 41) / 6));
  return { colors: 9 + extra, empties: 1, hidden: true, scramble: 18 + extra * 2 };
}
// Petite phrase qui decrit le niveau. Le jeu affiche la sienne, avec les accents.
function bandLabel(spec) {
  const mel = `${spec.colors} melasses`;
  const empty = spec.empties > 1 ? `${spec.empties} fioles vides` : "une fiole vide";
  const veil2 = spec.hidden ? ", couches voilees" : "";
  return `${mel}, ${empty}${veil2}`;
}
// Copie les fioles. On ne modifie pas le tableau d'origine.
function cloneVials(vials) {
  return vials.map((v) => v.map((s) => ({ color: s.color, hidden: s.hidden })));
}
// Quand une bande part, toute la bande suivante devient visible.
function revealVialTop(vial) {
  if (vial.length === 0) return;
  const color = vial[vial.length - 1].color;
  vial[vial.length - 1].hidden = false;
  for (let i = vial.length - 2; i >= 0; i--) {
    if (vial[i].color !== color) break;
    vial[i].hidden = false;
  }
}
function revealBoard(vials) {
  for (const v of vials) revealVialTop(v);
  return vials;
}
function topRun(vial) {
  if (vial.length === 0) return null;
  const color = vial[vial.length - 1].color;
  if (vial[vial.length - 1].hidden) return null;
  let count = 1;
  for (let i = vial.length - 2; i >= 0; i--) {
    if (vial[i].color !== color || vial[i].hidden) break;
    count++;
  }
  return { color, count };
}
// Vrai si la fiole est pleine d'une seule couleur. Elle se bouche.
function isSealed(vial) {
  if (vial.length !== CAPACITY) return false;
  const c = vial[0].color;
  return vial.every((s) => s.color === c && !s.hidden);
}
// Vrai si chaque fiole est vide ou bouchee.
function isWon(vials) {
  return vials.every((v) => v.length === 0 || isSealed(v));
}
// Nombre de bandes de couleur. Sert a melanger un niveau soluble.
function runCount(vials) {
  let n = 0;
  for (const v of vials) {
    let prev = -1;
    for (const s of v) {
      if (s.color !== prev) {
        n++;
        prev = s.color;
      }
    }
  }
  return n;
}
// Verse si la regle le permet. Sinon retourne null. Ne change pas la regle.
function pour(vials, from, to, respectSeal = true) {
  if (from === to) return null;
  if (from < 0 || to < 0 || from >= vials.length || to >= vials.length) return null;
  const src = vials[from];
  const dst = vials[to];
  if (src.length === 0) return null;
  if (respectSeal && isSealed(src)) return null;
  const run = topRun(src);
  if (!run) return null;
  const space = CAPACITY - dst.length;
  if (space <= 0) return null;
  if (dst.length > 0) {
    const top = dst[dst.length - 1];
    if (top.hidden || top.color !== run.color) return null;
  }
  const k = Math.min(run.count, space);
  const next = cloneVials(vials);
  const moved = next[from].splice(next[from].length - k, k).map((s) => ({
    color: s.color,
    hidden: false
  }));
  if (next[from].length > 0) revealVialTop(next[from]);
  next[to].push(...moved);
  revealVialTop(next[to]);
  return next;
}
// Deplace k unites, sans verifier. Usage interne du melangeur.
function moveTop(vials, from, to, k) {
  const next = cloneVials(vials);
  const moved = next[from].splice(next[from].length - k, k);
  next[to].push(...moved);
  return next;
}
// Compare deux plateaux, sans regarder le voile.
function sameColors(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j].color !== b[i][j].color) return false;
    }
  }
  return true;
}
// Cache tout ce qui est sous la bande du dessus.
function veil(vials) {
  return vials.map((v) => {
    if (v.length === 0) return [];
    const top = v[v.length - 1].color;
    let run = 1;
    for (let i = v.length - 2; i >= 0; i--) {
      if (v[i].color !== top) break;
      run++;
    }
    const visibleFrom = v.length - run;
    return v.map((s, i) => ({ color: s.color, hidden: i < visibleFrom }));
  });
}
// Hasard reproductible. Le meme niveau reste le meme.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// Cherche un coup inverse legal, pour defaire un plateau range.
function findUnsolve(vials, rng) {
  const n = vials.length;
  const options = [];
  for (let d = 0; d < n; d++) {
    const run = topRun(vials[d]);
    if (!run) continue;
    for (let s = 0; s < n; s++) {
      if (s === d) continue;
      const space = CAPACITY - vials[s].length;
      const maxK = Math.min(run.count, space);
      for (let k = 1; k <= maxK; k++) {
        const earlier = moveTop(vials, d, s, k);
        const restored = pour(earlier, s, d, false);
        if (!restored) continue;
        if (!sameColors(restored, vials)) continue;
        if (runCount(earlier) <= runCount(vials)) continue;
        options.push({ earlier, forward: { from: s, to: d } });
      }
    }
  }
  if (options.length === 0) return null;
  return options[Math.floor(rng() * options.length)];
}
// Melange l'ordre des fioles, et la solution avec.
function permuteLevel(vials, solution, rng) {
  const n = vials.length;
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  const inv = new Array(n);
  perm.forEach((old, neu) => {
    inv[old] = neu;
  });
  return {
    vials: perm.map((old) => vials[old]),
    solution: solution.map((m) => ({ from: inv[m.from], to: inv[m.to] }))
  };
}
// Part d'un plateau range et le defait.
function scramble(spec, seed) {
  const rng = mulberry32(seed);
  let vials = [];
  for (let c = 0; c < spec.colors; c++) {
    const tube = [];
    for (let i = 0; i < CAPACITY; i++) tube.push({ color: c, hidden: false });
    vials.push(tube);
  }
  for (let e = 0; e < spec.empties; e++) vials.push([]);
  const stack = [];
  let guard = 0;
  while (stack.length < spec.scramble && guard < spec.scramble * 30) {
    guard++;
    const step = findUnsolve(vials, rng);
    if (!step) break;
    vials = step.earlier;
    stack.push(step.forward);
  }
  const solution = stack.reverse();
  const mixed = permuteLevel(vials, solution, rng);
  return {
    vials: spec.hidden ? veil(mixed.vials) : mixed.vials,
    solution: mixed.solution
  };
}
// Choisit un melange que l'on peut finir.
function generateLevel(level) {
  const spec = specFor(level);
  const made = pickScramble(spec, (salt) => level * 9973 + salt * 131 + 17, 24);
  return { level, spec, vials: made.vials, solution: made.solution };
}
// Panique : entre 8 et 12 couleurs, toujours une fiole vide, toujours le voile.
// Le voile reste. Sans lui, ce serait un gros niveau de debut, pas une panique.
function berzerkSpec(seed) {
  const roll = mulberry32((seed || 1) >>> 0)();
  const colors = 8 + Math.floor(roll * 5);
  return { colors, empties: 1, hidden: true, scramble: 16 + (colors - 8) * 2 };
}
// Meme graine, meme panique. Une autre graine, un autre melange. Toujours soluble.
function generateBerzerk(seed) {
  const base = seed >>> 0;
  const spec = berzerkSpec(base);
  const made = pickScramble(spec, (salt) => (base + salt * 131 + 17) >>> 0, 8);
  return { spec, seed: base, vials: made.vials, solution: made.solution };
}
function pickScramble(spec, seedAt, salts) {
  let best = null;
  for (let salt = 0; salt < salts; salt++) {
    const made = scramble(spec, seedAt(salt));
    if (isWon(made.vials)) continue;
    if (!replayWins(made.vials, made.solution)) continue;
    if (!best || made.solution.length > best.solution.length) best = made;
    if (made.solution.length >= spec.scramble) break;
  }
  return best || scramble(spec, seedAt(0));
}
// Rejoue la solution pour verifier qu'elle gagne.
function replayWins(start, solution) {
  let cur = cloneVials(start);
  for (const m of solution) {
    const next = pour(cur, m.from, m.to, true);
    if (!next) return false;
    cur = next;
  }
  return isWon(cur);
}
// Tous les versements permis maintenant.
function legalMoves(vials) {
  const out = [];
  for (let from = 0; from < vials.length; from++) {
    for (let to = 0; to < vials.length; to++) {
      if (pour(vials, from, to, true)) out.push({ from, to });
    }
  }
  return out;
}
// Note un coup pour l'indice, si la recherche complete est trop longue.
function scoreMove(vials, m) {
  const next = pour(vials, m.from, m.to, true);
  if (!next) return -9999;
  let s = 0;
  if (isSealed(next[m.to])) s += 50;
  s += (runCount(vials) - runCount(next)) * 20;
  const src = vials[m.from];
  const cut = src.length - next[m.from].length;
  const under = src[src.length - cut - 1];
  if (under?.hidden) s += 8;
  if (vials[m.to].length === 0) s -= 12;
  const mono = src.length > 0 && src.every((seg) => seg.color === src[0].color && !seg.hidden);
  if (mono && !isSealed(next[m.to])) s -= 25;
  return s;
}
function boardKey(vials) {
  return vials.map((v) => v.map((s) => `${s.color}${s.hidden ? "?" : ""}`).join(",")).join("|");
}
// Prochain coup d'une ligne deja connue. Null si la partie a quitte cette ligne.
function hintAlong(vials, start, solution) {
  if (!start || !solution) return null;
  const keys = [];
  let cur = start;
  keys.push(boardKey(cur));
  for (const step of solution) {
    const next = pour(cur, step.from, step.to, true);
    if (!next) break;
    cur = next;
    keys.push(boardKey(cur));
  }
  const here = boardKey(vials);
  const at = keys.indexOf(here);
  if (at >= 0 && at < solution.length) return solution[at];
  let back = null;
  let backAt = Infinity;
  for (const m of legalMoves(vials)) {
    const next = pour(vials, m.from, m.to, true);
    if (!next) continue;
    const j = keys.indexOf(boardKey(next));
    if (j > at && j < backAt) {
      back = m;
      backAt = j;
    }
  }
  return back;
}
// Le prochain coup d'une ligne qui gagne. Pas une note qui mene au mur.
// line : le melange de Panique, deja tire. Sinon on reconstruit le niveau.
function hintMove(vials, level, line) {
  if (isWon(vials)) return null;
  if (line && line.start && line.solution) {
    const along = hintAlong(vials, line.start, line.solution);
    if (along) return along;
  } else if (typeof level === "number") {
    const made = generateLevel(level);
    const along = hintAlong(vials, made.vials, made.solution);
    if (along) return along;
  }
  const moves = legalMoves(vials);
  if (moves.length === 0) return null;
  if (colorsIn(vials) <= 6) {
    const found = bfsFirst(vials, 6000);
    if (found) return found;
  }
  const safe = moves.filter((m) => {
    const next = pour(vials, m.from, m.to, true);
    return next && canStillWin(next) !== false;
  });
  if (safe.length === 0) return null;
  let best = safe[0];
  let bestScore = scoreMove(vials, best);
  for (const m of safe) {
    const sc = scoreMove(vials, m);
    if (sc > bestScore) {
      best = m;
      bestScore = sc;
    }
  }
  return best;
}
function colorsIn(vials) {
  const colors = new Set();
  for (const v of vials) for (const s of v) colors.add(s.color);
  return colors.size;
}
// Cherche le premier coup d'une solution, sur les petits niveaux.
function bfsFirst(vials, cap) {
  const keyOf = (vs) => vs.map((v) => v.map((s) => `${s.color}${s.hidden ? "?" : ""}`).join(",")).join("|");
  const q = [{ vials, first: null }];
  const seen = /* @__PURE__ */ new Set([keyOf(vials)]);
  let nodes = 0;
  while (q.length > 0 && nodes < cap) {
    const cur = q.shift();
    if (!cur) break;
    nodes++;
    for (const m of legalMoves(cur.vials)) {
      const next = pour(cur.vials, m.from, m.to, true);
      if (!next) continue;
      const k = keyOf(next);
      if (seen.has(k)) continue;
      seen.add(k);
      const first = cur.first ?? m;
      if (isWon(next)) return first;
      q.push({ vials: next, first });
    }
  }
  return null;
}
// Comme revealVialTop, pendant l'animation.
function revealSlugs(src) {
  if (src.length === 0) return;
  const color = src[src.length - 1].color;
  src[src.length - 1].hidden = false;
  for (let i = src.length - 2; i >= 0; i--) {
    if (src[i].color !== color) break;
    src[i].hidden = false;
  }
}
// Hauteurs pendant que le liquide quitte la fiole.
function slugsAfterShave(vial, units) {
  const src = vial.map((s) => ({ color: s.color, hidden: s.hidden, h: 1 }));
  let left = units;
  while (left > 1e-3 && src.length > 0) {
    const top = src[src.length - 1];
    const d = Math.min(top.h, left);
    top.h -= d;
    left -= d;
    if (top.h <= 1e-3) src.pop();
  }
  revealSlugs(src);
  return src.filter((b) => b.h > 0.02);
}
// Hauteurs pendant que le liquide arrive. La meme couleur s'ajoute au bloc.
function slugsGrow(vial, color, units) {
  const slugs = slugsAfterShave(vial, 0);
  if (units <= 1e-3) return slugs;
  const top = slugs[slugs.length - 1];
  if (top && !top.hidden && top.color === color) top.h += units;
  else slugs.push({ color, hidden: false, h: units });
  return slugs;
}
// Verifications internes. Pas utilisees par la page.
function selfTest() {
  const lines = [];
  const fail = (m) => lines.push(`FAIL ${m}`);
  const blocked = pour(
    [[{ color: 0, hidden: false }], [{ color: 1, hidden: false }]],
    0,
    1,
    true
  );
  if (blocked) fail("couleur differente acceptee");
  const sealed = pour(
    [
      [
        { color: 0, hidden: false },
        { color: 0, hidden: false },
        { color: 0, hidden: false },
        { color: 0, hidden: false }
      ],
      []
    ],
    0,
    1,
    true
  );
  if (sealed) fail("fiole bouchee versee");
  for (const level of [1, 2, 3, 6, 12, 20, 24, 36]) {
    const made = generateLevel(level);
    const wins = replayWins(made.vials, made.solution);
    lines.push(
      `niveau ${level} : ${made.solution.length} coups, ${made.spec.colors} couleurs, voile ${made.spec.hidden ? "oui" : "non"}, gagne ${wins ? "oui" : "non"}`
    );
    if (!wins) fail(`solution niveau ${level}`);
    if (isWon(made.vials)) fail(`deja gagne ${level}`);
    if (level === 1 && (made.solution.length < 2 || made.solution.length > 6)) {
      fail(`niveau 1 trop long ou trop court (${made.solution.length})`);
    }
  }
  const again = generateLevel(4);
  const twice = generateLevel(4);
  const same = again.vials.length === twice.vials.length && again.vials.every((v, i) => sameColors([v], [twice.vials[i]]));
  if (!same) fail("niveau non deterministe");
  const ok = lines.every((l) => !l.startsWith("FAIL"));
  return { ok, lines };
}
// false : aucun enchainement ne gagne, meme si un versement reste.
// null : pas le temps d'etre sur, ou un versement devoile encore une couche. On ne bloque pas.
// true : un chemin gagne.
function canStillWin(vials) {
  if (isWon(vials)) return true;
  const moves = legalMoves(vials);
  if (moves.length === 0) return false;
  for (const m of moves) {
    const next = pour(vials, m.from, m.to, true);
    if (!next) continue;
    const before = vials[m.from];
    const after = next[m.from];
    for (let i = 0; i < after.length; i++) {
      if (before[i].hidden && !after[i].hidden) return null;
    }
  }
  const keyOf = (vs) => vs.map((v) => v.map((s) => `${s.color}${s.hidden ? "?" : ""}`).join(",")).join("|");
  const q = [vials];
  const seen = new Set([keyOf(vials)]);
  let head = 0;
  let nodes = 0;
  const cap = 8000;
  const start = Date.now();
  while (head < q.length && nodes < cap) {
    if ((nodes & 63) === 0 && Date.now() - start > 24) return null;
    const cur = q[head++];
    nodes++;
    for (const m of legalMoves(cur)) {
      const next = pour(cur, m.from, m.to, true);
      if (!next) continue;
      const k = keyOf(next);
      if (seen.has(k)) continue;
      seen.add(k);
      if (isWon(next)) return true;
      q.push(next);
    }
  }
  if (head < q.length || nodes >= cap) return null;
  return false;
}

export {
  CAPACITY,
  MELASSES,
  bandLabel,
  berzerkSpec,
  canStillWin,
  cloneVials,
  generateBerzerk,
  generateLevel,
  hintMove,
  isSealed,
  isWon,
  legalMoves,
  mulberry32,
  pour,
  replayWins,
  revealBoard,
  runCount,
  selfTest,
  slugsAfterShave,
  slugsGrow,
  specFor,
  topRun,
  veil
};
