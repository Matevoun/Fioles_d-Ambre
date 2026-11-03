/*
 * Jeu : Fioles d'Ambre
 * Les boutons, la partie, l'enregistrement dans le navigateur.
 * ©2026, Mathieu CHARREYRE pour WDA & Ambre.
 * Avant une modification : Lire JS/doctrine.js
 *
 * Ce fichier est fait pour etre lu. Les autres, dans le meme dossier JS :
 *    regle.js  : Les regles
 *    dessin.js : Les fioles
 *    son.js    : Les sons
 *  doctrine.js : Les regles de codage
 *    textes.js : Les textes
 * Les images sont dans Picts. La feuille est CSS/fioles.css.
 */

import {
  canStillWin,
  cloneVials,
  generateBerzerk,
  generateLevel,
  hintMove,
  isSealed,
  isWon,
  pour,
  replayWins,
  revealBoard,
  slugsAfterShave,
  slugsGrow,
  specFor,
} from "./regle.js";
import { drawScene, hitTest } from "./dessin.js";
import { createMixer } from "./son.js";
import { DOCTRINE_VERSION, GAME_VERSION } from "./doctrine.js";
import { ligneCoups, ligneNiveau, textes } from "./textes.js";

const SAVE_KEY = "fioles-ambre-v1";

// Cree un niveau tout neuf, pret a jouer ou a montrer le titre.
function fresh(level, unlocked, phase, seen, muted, seenPlateau) {
  const made = generateLevel(level);
  return {
    level,
    unlocked,
    vials: cloneVials(made.vials),
    initial: cloneVials(made.vials),
    past: [],
    moves: 0,
    spec: made.spec,
    mode: "campagne",
    solution: null,
    seed: 0,
    campaign: null,
    selected: null,
    hint: null,
    note: null,
    phase,
    seen,
    muted,
    seenPlateau: Boolean(seenPlateau),
  };
}

// Phrase sous le titre du niveau. Les mots sont dans textes.js.
function labelOf(spec) {
  return ligneNiveau(spec);
}

function ease(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

const app = document.querySelector("#app");
const mixer = createMixer();
let model = fresh(1, 1, "title", false, false);
let about = false;
let wipeAsk = false;
let capAsk = false;
let anim = null;
let layouts = [];
let reduce = false;
let arm = 0;
let canvas = null;
let ctx = null;
let frame = 0;

// Enregistre la partie dans ce navigateur. Pas sur le serveur.
function save() {
  const data = {
    v: 1,
    level: model.level,
    unlocked: model.unlocked,
    moves: model.moves,
    vials: model.vials,
    initial: model.initial,
    past: model.past,
    seen: model.seen,
    muted: model.muted,
    seenPlateau: model.seenPlateau,
    mode: model.mode || "campagne",
    solution: model.solution || null,
    seed: model.seed || 0,
    spec: model.spec || null,
    campaign: model.campaign || null,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function isVial(value) {
  if (!Array.isArray(value)) return false;
  return value.every(
    (s) => s && typeof s.color === "number" && typeof s.hidden === "boolean",
  );
}

function isMoveList(value, n) {
  return Array.isArray(value) && value.every((m) => m && Number.isInteger(m.from) && Number.isInteger(m.to) && m.from >= 0 && m.to >= 0 && m.from < n && m.to < n && m.from !== m.to);
}

function readCampaign(value) {
  if (!value || typeof value.level !== "number" || !Array.isArray(value.vials) || !Array.isArray(value.initial)) return null;
  if (!value.vials.every(isVial) || !value.initial.every(isVial)) return null;
  const past = Array.isArray(value.past) ? value.past.filter((v) => Array.isArray(v) && v.every(isVial)) : [];
  return {
    level: Math.max(1, Math.floor(value.level)),
    vials: value.vials,
    initial: value.initial,
    past: past.slice(-80),
    moves: typeof value.moves === "number" ? value.moves : 0,
    spec: value.spec,
    phase: value.phase === "play" ? "play" : "title",
    seen: Boolean(value.seen),
  };
}

function specPanique(value, n) {
  if (value && value.colors + value.empties === n && value.colors >= 8 && value.colors <= 12 && value.empties === 1) {
    return {
      colors: value.colors,
      empties: 1,
      hidden: value.hidden !== false,
      scramble: typeof value.scramble === "number" ? value.scramble : 16 + (value.colors - 8) * 2,
    };
  }
  if (n >= 9 && n <= 13) return { colors: n - 1, empties: 1, hidden: true, scramble: 16 + (n - 9) * 2 };
  return null;
}

// Relit une partie sauvee. Refuse un fichier casse.
function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.v !== 1 || typeof data.level !== "number") return;
    const unlocked = Math.max(1, typeof data.unlocked === "number" ? Math.floor(data.unlocked) : Math.floor(data.level));
    if (data.mode === "berzerk") {
      if (!Array.isArray(data.vials) || !Array.isArray(data.initial)) return;
      if (!data.vials.every(isVial) || !data.initial.every(isVial)) return;
      const n = data.vials.length;
      const spec = specPanique(data.spec, n);
      if (!spec || data.initial.length !== n) return;
      let solution = isMoveList(data.solution, n) ? data.solution : null;
      let initial = data.initial;
      let vials = data.vials;
      const seed = typeof data.seed === "number" ? data.seed >>> 0 : 0;
      if (!solution || !replayWins(initial, solution)) {
        if (!seed) return;
        const made = generateBerzerk(seed);
        initial = made.vials;
        vials = cloneVials(made.vials);
        solution = made.solution;
        spec.colors = made.spec.colors;
        spec.empties = made.spec.empties;
        spec.hidden = made.spec.hidden;
        spec.scramble = made.spec.scramble;
      }
      const past = Array.isArray(data.past) ? data.past.filter((v) => Array.isArray(v) && v.every(isVial)) : [];
      model = {
        mode: "berzerk",
        level: 0,
        unlocked,
        vials,
        initial,
        solution,
        seed,
        campaign: readCampaign(data.campaign),
        past: past.slice(-80),
        moves: typeof data.moves === "number" ? data.moves : 0,
        spec,
        selected: null,
        hint: null,
        note: null,
        phase: "play",
        seen: true,
        muted: Boolean(data.muted),
        seenPlateau: Boolean(data.seenPlateau),
      };
    } else {
      const level = Math.max(1, Math.floor(data.level));
      const spec = specFor(level);
      if (!Array.isArray(data.vials) || !Array.isArray(data.initial)) return;
      if (!data.vials.every(isVial) || !data.initial.every(isVial)) return;
      if (data.vials.length !== spec.colors + spec.empties) return;
      const past = Array.isArray(data.past) ? data.past.filter((v) => Array.isArray(v) && v.every(isVial)) : [];
      model = {
        mode: "campagne",
        level,
        unlocked: Math.max(level, unlocked),
        vials: data.vials,
        initial: data.initial,
        solution: null,
        seed: 0,
        campaign: null,
        past: past.slice(-80),
        moves: typeof data.moves === "number" ? data.moves : 0,
        spec,
        selected: null,
        hint: null,
        note: null,
        phase: data.seen ? "play" : "title",
        seen: Boolean(data.seen),
        muted: Boolean(data.muted),
        seenPlateau: Boolean(data.seenPlateau),
      };
    }
    revealBoard(model.vials);
    if (isWon(model.vials)) model.phase = "won";
    else if (model.phase === "play" && canStillWin(model.vials) === false) model.phase = "lost";
  } catch {
    /* partie illisible : on recommence au titre */
  }
}

// Termine un versement : compte le coup, bouche, ou annonce la victoire.
function finishPour(done) {
  if (anim !== done) return;
  anim = null;
  const won = isWon(done.after);
  if (done.seals) mixer.cork();
  if (won) mixer.win();
  const open = won ? true : canStillWin(done.after, [...model.past, done.before]);
  const lost = open === false;
  model = {
    ...model,
    vials: done.after,
    past: [...model.past, cloneVials(done.before)].slice(-80),
    moves: model.moves + 1,
    selected: null,
    hint: null,
    phase: won ? "won" : lost ? "lost" : "play",
    unlocked: won && model.mode !== "berzerk" ? Math.max(model.unlocked, model.level + 1) : model.unlocked,
    note: null,
  };
  save();
  paintChrome();
}

function shake(index) {
  anim = { kind: "shake", index, t0: performance.now() };
  mixer.deny();
}

// Un toucher sur une fiole : la choisir, ou verser dedans.
function choose(index) {
  if (model.phase !== "play") return;
  if (anim?.kind === "pour") return;
  mixer.unlock();
  const vial = model.vials[index];
  if (model.selected === null) {
    if (!vial || vial.length === 0 || isSealed(vial)) {
      shake(index);
      return;
    }
    mixer.select();
    model = { ...model, selected: index, note: null };
    save();
    paintChrome();
    return;
  }
  if (model.selected === index) {
    model = { ...model, selected: null };
    save();
    paintChrome();
    return;
  }
  const after = pour(model.vials, model.selected, index, true);
  if (!after) {
    shake(index);
    return;
  }
  const src = model.vials[model.selected];
  const color = src[src.length - 1].color;
  const k = after[index].length - model.vials[index].length;
  mixer.pour();
  anim = {
    kind: "pour",
    from: model.selected,
    to: index,
    color,
    k,
    before: cloneVials(model.vials),
    after,
    t0: performance.now(),
    dur: reduce ? 40 : 700,
    seals: isSealed(after[index]),
  };
  model = { ...model, selected: null, hint: null, note: null };
  save();
  paintChrome();
}

function onPointer(e) {
  if (performance.now() < arm) return;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const hit = hitTest(layouts, e.clientX - rect.left, e.clientY - rect.top);
  if (hit === null) {
    if (model.selected !== null) {
      model = { ...model, selected: null };
      save();
      paintChrome();
    }
    return;
  }
  choose(hit);
}

function undo() {
  if (model.phase === "title") return;
  mixer.unlock();
  if (anim?.kind === "pour") {
    anim = null;
    model = { ...model, selected: null, hint: null, note: null, phase: "play" };
    save();
    paintChrome();
    return;
  }
  if (model.past.length === 0) return;
  const vials = cloneVials(model.past[model.past.length - 1]);
  model = {
    ...model,
    vials,
    past: model.past.slice(0, -1),
    moves: Math.max(0, model.moves - 1),
    selected: null,
    hint: null,
    note: null,
    phase: "play",
  };
  save();
  paintChrome();
}

function restart() {
  if (anim?.kind === "pour") return;
  mixer.unlock();
  anim = null;
  model = {
    ...model,
    vials: cloneVials(model.initial),
    past: [],
    moves: 0,
    selected: null,
    hint: null,
    note: null,
    phase: "play",
  };
  save();
  paintChrome();
}

function go(level) {
  if (level < 1 || level > model.unlocked) return;
  if (anim?.kind === "pour") return;
  anim = null;
  mixer.unlock();
  model = fresh(level, model.unlocked, "play", true, model.muted, model.seenPlateau);
  save();
  render();
}

function hint() {
  if (model.phase !== "play" || anim?.kind === "pour") return;
  mixer.unlock();
  const move = hintMove(
    model.vials,
    model.level,
    model.mode === "berzerk" ? { start: model.initial, solution: model.solution } : null,
  );
  if (!move) {
    model = { ...model, note: textes.noteRien, hint: null };
  } else {
    model = { ...model, hint: move, selected: move.from, note: textes.noteIndice };
  }
  save();
  paintChrome();
}

function toggleMute() {
  mixer.unlock();
  if (!model.muted && model.phase === "title" && !mixer.labOn()) {
    syncLab();
    return;
  }
  model = { ...model, muted: !model.muted };
  mixer.setMuted(model.muted);
  syncLab();
  save();
  paintChrome();
}

function start() {
  arm = performance.now() + 450;
  mixer.unlock();
  mixer.setMuted(model.muted);
  model = { ...model, mode: "campagne", phase: "play", seen: true };
  save();
  render();
}

// Panique : un melange neuf, au maximum. La campagne en cours est mise de cote.
function enterBerzerk() {
  if (anim?.kind === "pour") return;
  if (model.mode === "berzerk") {
    newDeal();
    return;
  }
  const campaign = {
    level: model.level,
    vials: cloneVials(model.vials),
    initial: cloneVials(model.initial),
    past: model.past.map((v) => cloneVials(v)),
    moves: model.moves,
    spec: model.spec,
    phase: model.phase,
    seen: model.seen,
  };
  mixer.unlock();
  about = false;
  anim = null;
  const next = dealBerzerk(model.unlocked, model.muted, model.seenPlateau);
  next.campaign = campaign;
  model = next;
  save();
  render();
}

function dealBerzerk(unlocked, muted, seenPlateau) {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x100000000)) >>> 0;
  const made = generateBerzerk(seed);
  return {
    mode: "berzerk",
    level: 0,
    unlocked,
    vials: cloneVials(made.vials),
    initial: cloneVials(made.vials),
    solution: made.solution.map((m) => ({ from: m.from, to: m.to })),
    seed: made.seed,
    campaign: null,
    past: [],
    moves: 0,
    spec: made.spec,
    selected: null,
    hint: null,
    note: null,
    phase: "play",
    seen: true,
    muted,
    seenPlateau: Boolean(seenPlateau),
  };
}

function newDeal() {
  if (anim?.kind === "pour") return;
  mixer.unlock();
  anim = null;
  about = false;
  capAsk = false;
  const campaign = model.campaign;
  const next = dealBerzerk(model.unlocked, model.muted, model.seenPlateau);
  next.campaign = campaign;
  model = next;
  save();
  render();
}

function leaveBerzerk() {
  if (model.mode !== "berzerk" || anim?.kind === "pour") return;
  const kept = model.campaign;
  const unlocked = model.unlocked;
  const muted = model.muted;
  const seenPlateau = model.seenPlateau;
  about = false;
  anim = null;
  if (!kept || kept.phase === "title" || !Array.isArray(kept.vials)) {
    const level = Math.max(1, Math.min(unlocked, kept && kept.level ? kept.level : 1));
    model = fresh(level, unlocked, "title", false, muted, seenPlateau);
  } else {
    model = {
      mode: "campagne",
      level: kept.level,
      unlocked: Math.max(kept.level, unlocked),
      vials: cloneVials(kept.vials),
      initial: cloneVials(kept.initial),
      solution: null,
      seed: 0,
      campaign: null,
      past: kept.past,
      moves: kept.moves,
      spec: specFor(kept.level),
      selected: null,
      hint: null,
      note: null,
      phase: "play",
      seen: true,
      muted,
      seenPlateau,
    };
    revealBoard(model.vials);
    if (isWon(model.vials)) model.phase = "won";
  }
  save();
  render();
}

function setAbout(open) {
  about = open;
  if (!open) wipeAsk = false;
  paintChrome();
}

// Efface la partie enregistree et revient a l'accueil, niveau 1.
function wipeAll() {
  localStorage.removeItem(SAVE_KEY);
  anim = null;
  about = false;
  wipeAsk = false;
  model = fresh(1, 1, "title", false, false);
  mixer.setMuted(false);
  render();
}

// Boucle d'image. Lit les fioles et dessine. Ne reconstruit pas la page.
function loop(now) {
  if (!ctx || !canvas || model.phase === "title") return;
  let shakeIndex = null;
  let shakeP = 0;
  if (anim?.kind === "shake") {
    const p = 1 - (now - anim.t0) / 380;
    if (p <= 0) anim = null;
    else {
      shakeIndex = anim.index;
      shakeP = p;
    }
  }
  if (anim?.kind === "pour") {
    const p = (now - anim.t0) / anim.dur;
    if (p >= 1) finishPour(anim);
  }
  const live = anim;
  const slugs = model.vials.map((v) => slugsAfterShave(v, 0));
  let stream = null;
  let corkIndex = null;
  let corkP = null;
  if (live?.kind === "pour") {
    const p = ease((now - live.t0) / live.dur);
    for (let i = 0; i < slugs.length; i++) {
      if (i === live.from) slugs[i] = slugsAfterShave(live.before[i], live.k * p);
      else if (i === live.to) slugs[i] = slugsGrow(live.before[i], live.color, live.k * p);
      else slugs[i] = slugsAfterShave(live.before[i], 0);
    }
    stream = { from: live.from, to: live.to, color: live.color, p };
    if (live.seals) {
      corkIndex = live.to;
      corkP = Math.min(1, Math.max(0, (p - 0.62) / 0.38));
    }
  }
  const source = live?.kind === "pour" ? live.before : model.vials;
  const sealed = source.map((v, i) => {
    if (live?.kind === "pour" && i === live.to) return false;
    return isSealed(v);
  });
  layouts = drawScene(ctx, canvas.clientWidth, canvas.clientHeight, {
    slugs,
    sealed,
    selected: model.selected,
    shakeIndex,
    shakeP,
    hint: model.hint,
    stream,
    corkIndex,
    corkP,
    time: now / 1000,
    won: model.phase === "won",
  });
  frame = requestAnimationFrame(loop);
}

function resize() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
  canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Icone dans un bouton. Le chemin part de index.html, pas du fichier JS.
function icone(nom) {
  return `<img src="Picts/${nom}.svg" alt="" width="18" height="18">`;
}
// Bulle au survol, et nom pour le lecteur d'ecran. Le alt d'un bouton n'existe pas.
function bulle(cle) {
  const t = textes[cle];
  return `title="${t}" aria-label="${t}"`;
}
function syncLab() {
  mixer.lab(model.phase === "title" && !model.muted);
}

function render() {
  cancelAnimationFrame(frame);
  const coups = ligneCoups(model.moves);
  if (model.phase === "title") {
    app.innerHTML = `
      <main class="stage title" data-doctrine="${DOCTRINE_VERSION}">
        <button type="button" class="icon-btn title-mute" data-act="mute" ${bulle(model.muted ? "aideSon" : "aideSilence")}>${icone(model.muted ? "silence" : "son")}</button>
        <section class="title-card">
          <p class="eyebrow">${textes.pourAmbre}</p>
          <h1>${textes.titre}</h1>
          <p class="version">${textes.version} ${GAME_VERSION}</p>
          <p class="rule">${textes.regle}</p>
          <button type="button" class="btn primary" data-act="start" ${bulle("aideCommencer")}>${textes.commencer}</button>
          <button type="button" class="btn" data-act="panique" ${bulle("aidePanique")}>${textes.panique}</button>
          <button type="button" class="btn ghost" data-act="about" ${bulle("aidePropos")}>${textes.aPropos}</button>
        </section>
      </main>`;
    canvas = null;
    ctx = null;
  } else {
    app.innerHTML = `
      <main class="stage" data-doctrine="${DOCTRINE_VERSION}">
        <header class="topbar">
          <div>
            <p class="mark">${textes.titre} <span class="version">${GAME_VERSION}</span></p>
            <h1>${model.mode === "berzerk" ? textes.paniqueCourt : `${textes.niveau} ${model.level}`}<span> ${coups}</span></h1>
            <p class="band">${labelOf(model.spec)}</p>
          </div>
          <div class="top-actions">
            ${model.mode === "berzerk" ? `<button type="button" class="btn" data-act="deal" ${bulle("aideAutre")}>${textes.autreMelange}</button>` : ""}
            <button type="button" class="icon-btn" data-act="mute" ${bulle(model.muted ? "aideSon" : "aideSilence")}>${icone(model.muted ? "silence" : "son")}</button>
          </div>
        </header>
        <p class="note" data-note></p>
        <div class="play-canvas"><canvas></canvas></div>
        <footer class="dock">
          <button type="button" class="btn" data-act="undo" ${bulle("aideAnnuler")}>${icone("annuler")}<span>${textes.annuler}</span></button>
          <button type="button" class="btn" data-act="restart" ${bulle("aideRecommencer")}>${icone("recommencer")}<span>${textes.recommencer}</span></button>
          <button type="button" class="btn" data-act="hint" ${bulle("aideIndice")}>${icone("indice")}<span>${textes.indice}</span></button>
          <button type="button" class="btn" data-act="about" ${bulle("aidePropos")}>${icone("apropos")}<span>${textes.aPropos}</span></button>
        </footer>
      </main>`;
    canvas = app.querySelector("canvas");
    ctx = canvas.getContext("2d");
    canvas.addEventListener("pointerdown", onPointer);
    resize();
    frame = requestAnimationFrame(loop);
  }
  paintChrome();
  syncLab();
}

// Met a jour les textes et les fenetres sans relancer le dessin.
function paintChrome() {
  const note = app.querySelector("[data-note]");
  if (note) {
    note.textContent = model.note || textes.consigne;
    note.className = model.note ? "note" : "note quiet";
  }
  const h1 = app.querySelector(".topbar h1");
  if (h1) {
    const coups = ligneCoups(model.moves);
    h1.innerHTML = `${model.mode === "berzerk" ? textes.paniqueCourt : `${textes.niveau} ${model.level}`}<span> ${coups}</span>`;
  }
  const undoBtn = app.querySelector("[data-act=undo]");
  if (undoBtn) undoBtn.disabled = model.past.length === 0 && anim?.kind !== "pour";
  const mute = app.querySelector("[data-act=mute]");
  if (mute) {
    mute.innerHTML = icone(model.muted ? "silence" : "son");
    const aide = model.muted ? textes.aideSon : textes.aideSilence;
    mute.setAttribute("aria-label", aide);
    mute.title = aide;
  }
  app.querySelectorAll(".veil").forEach((n) => n.remove());
  const stage = app.querySelector(".stage");
  if (!stage) return;
  if (model.phase === "won" && !capAsk) {
    const coups = ligneCoups(model.moves);
    stage.insertAdjacentHTML(
      "beforeend",
      `<div class="veil" role="dialog">
        <div class="card">
          <h2>${textes.gagneTitre}</h2>
          <p>${model.mode === "berzerk" ? `${textes.paniqueCourt}, ${coups}.` : `${textes.niveau} ${model.level}, ${coups}.`}</p>
          ${
            model.mode === "berzerk"
              ? `<button type="button" class="btn primary" data-act="deal" ${bulle("aideAutre")}>${textes.autreMelange}</button>`
              : `<button type="button" class="btn primary" data-act="next" ${bulle("aideSuivant")}>${textes.niveauSuivant}</button>`
          }
          <button type="button" class="btn" data-act="restart" ${bulle("aideRecommencer")}>${textes.recommencer}</button>
        </div>
      </div>`,
    );
  }
  if (capAsk) {
    stage.insertAdjacentHTML(
      "beforeend",
      `<div class="veil" role="dialog">
        <div class="card">
          <h2>${textes.plafondTitre}</h2>
          <p>${textes.plafondBlague}</p>
          <p>${textes.plafondTexte}</p>
          <p>${textes.plafondFoutoir}</p>
          <button type="button" class="btn primary" data-act="continue-max" ${bulle("aideContinuer")}>${textes.continuer}</button>
          <button type="button" class="btn" data-act="panique" ${bulle("aidePanique")}>${textes.panique}</button>
        </div>
      </div>`,
    );
  }
  if (model.phase === "lost") {
    stage.insertAdjacentHTML(
      "beforeend",
      `<div class="veil" role="dialog">
        <div class="card">
          <h2>${textes.bloqueTitre}</h2>
          <p>${textes.bloqueTexte}</p>
          <button type="button" class="btn primary" data-act="undo" ${bulle("aideAnnuler")} ${model.past.length === 0 ? "disabled" : ""}>${textes.annuler}</button>
          <button type="button" class="btn" data-act="restart" ${bulle("aideRecommencer")}>${textes.recommencer}</button>
          ${model.mode === "berzerk" ? `<button type="button" class="btn" data-act="deal" ${bulle("aideAutre")}>${textes.autreMelange}</button>` : ""}
        </div>
      </div>`,
    );
  }
  if (about) {
    stage.insertAdjacentHTML(
      "beforeend",
      `<div class="veil" role="dialog">
        <div class="card">
          <h2>${textes.aProposTitre}</h2>
          <p class="credits">${textes.developpe} <strong>${textes.benevollement}</strong> ${textes.par} <a href="${textes.urlAuteur}" target="_blank" rel="noreferrer" ${bulle("aideAuteur")}>${textes.auteur}</a> ${textes.pourAsso}<a href="${textes.urlAsso}" target="_blank" rel="noreferrer" ${bulle("aideAsso")}>${textes.asso}</a>.</p>
          <p>${textes.prenom}</p>
          <p class="licence">${textes.licence}</p>
          <p class="links"><a href="${textes.urlWeb}" target="_blank" rel="noreferrer" ${bulle("aideWeb")}>${textes.versionWeb}</a><a href="${textes.urlConfidentialite}" target="_blank" rel="noreferrer" ${bulle("aideConfidentialite")}>${textes.confidentialite}</a></p>
          <p>${textes.don}</p>
          <p class="links"><a href="${textes.urlHello}" target="_blank" rel="noreferrer" ${bulle("aideHello")}>${textes.hello}</a><a href="${textes.urlPaypal}" target="_blank" rel="noreferrer" ${bulle("aidePaypal")}>${textes.paypal}</a></p>
          ${
            model.mode === "berzerk"
              ? `<button type="button" class="btn" data-act="leave" ${bulle("aideRetour")}>${textes.retourCampagne}</button>`
              : `<button type="button" class="btn" data-act="panique" ${bulle("aidePanique")}>${textes.panique}</button>`
          }
          ${
            wipeAsk
              ? `<p>${textes.effaceAvertissement}</p>
          <button type="button" class="btn" data-act="wipe-yes" ${bulle("aideOui")}>${textes.ouiEffacer}</button>`
              : `<button type="button" class="btn" data-act="wipe" ${bulle("aideEffacer")}>${textes.toutRecommencer}</button>`
          }
          <button type="button" class="btn primary" data-act="close" ${bulle("aideFermer")}>${textes.fermer}</button>
        </div>
      </div>`,
    );
  }
}

app.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === "start") start();
  else if (act === "panique") {
    if (capAsk) {
      capAsk = false;
      model = { ...model, seenPlateau: true };
    }
    enterBerzerk();
  }
  else if (act === "deal") newDeal();
  else if (act === "leave") leaveBerzerk();
  else if (act === "about") setAbout(true);
  else if (act === "close") setAbout(false);
  else if (act === "wipe") {
    wipeAsk = true;
    paintChrome();
  } else if (act === "wipe-yes") wipeAll();
  else if (act === "undo") undo();
  else if (act === "restart") restart();
  else if (act === "hint") hint();
  else if (act === "mute") toggleMute();
  else if (act === "next") {
    // Le 59 est le dernier cran. Le bandeau passe avant le 60, une seule fois.
    if (model.level === 59 && !model.seenPlateau) {
      capAsk = true;
      paintChrome();
    } else go(model.level + 1);
  } else if (act === "continue-max") {
    capAsk = false;
    model = { ...model, seenPlateau: true };
    go(60);
  }
});

window.addEventListener("resize", resize);
reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
load();
mixer.setMuted(model.muted);
render();
app.addEventListener("pointerdown", () => {
  if (model.phase !== "title") return;
  mixer.unlock();
  syncLab();
});
