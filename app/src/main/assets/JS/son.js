/*
 * Sons : Fioles d'Ambre
 * Sons synthetises. Pas de fichier audio a telecharger.
 * L'accueil a une nappe de laboratoire. Elle s'arrete hors de l'accueil.
 * ©2026, Mathieu CHARREYRE pour WDA & Ambre.
 * Avant une modification : Lire JS/doctrine.js
 */

// Prepare le son. pour, select, deny, cork, win.
function createMixer() {
  let ctx = null;
  let master = null;
  let pourBuf = null;
  let muted = false;
  let labOn = false;
  let labTimer = 0;
  let labNodes = null;
  const bowl = [293.66, 349.23, 440, 523.25, 659.25];
  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    const frames = Math.floor(ctx.sampleRate * 0.38);
    pourBuf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = pourBuf.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      const env = Math.sin(i / frames * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }
  }
  function bus() {
    ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
    return { ctx, master };
  }
  function tone(freq, dur, type, gain) {
    if (muted) return;
    const { ctx: ac, master: out } = bus();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(1e-4, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(1e-4, ac.currentTime + dur);
    osc.connect(g);
    g.connect(out);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.02);
  }
  function stopLab() {
    labWanted = false;
    if (labTimer) {
      window.clearInterval(labTimer);
      labTimer = 0;
    }
    labOn = false;
    if (!labNodes || !ctx) {
      labNodes = null;
      return;
    }
    const nodes = labNodes;
    labNodes = null;
    const t = ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(t);
    nodes.gain.gain.setValueAtTime(Math.max(nodes.gain.gain.value, 1e-4), t);
    nodes.gain.gain.linearRampToValueAtTime(1e-4, t + 0.45);
    for (const osc of nodes.oscs) osc.stop(t + 0.5);
    nodes.lfo.stop(t + 0.5);
  }
  function glass(freq) {
    if (muted || !ctx) return;
    const { master: out } = bus();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    g.gain.setValueAtTime(1e-4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.08);
    g.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + 2.6);
    osc.connect(filter);
    filter.connect(g);
    g.connect(out);
    osc.start();
    osc.stop(ctx.currentTime + 2.7);
  }
  let labWanted = false;
  function startLab() {
    if (muted) return;
    labWanted = true;
    const { ctx: ac, master: out } = bus();
    if (ac.state === "suspended") {
      void ac.resume().then(() => {
        if (labWanted && !labOn) armLab(ac, out);
      });
      return;
    }
    if (!labOn) armLab(ac, out);
  }
  function armLab(ac, out) {
    if (labOn || muted || !labWanted) return;
    const gain = ac.createGain();
    gain.gain.value = 0.2;
    gain.connect(out);
    const oscs = [];
    function drone(freq, vol) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.value = vol;
      osc.connect(g);
      g.connect(gain);
      osc.start();
      oscs.push(osc);
    }
    drone(110, 0.34);
    drone(164.81, 0.14);
    drone(220, 0.05);
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    labNodes = { oscs, lfo, gain };
    labOn = true;
    let step = 0;
    labTimer = window.setInterval(() => {
      if (!labOn || muted) return;
      if (step % 3 === 2) {
        step += 1;
        return;
      }
      glass(bowl[step % bowl.length]);
      step += 1;
    }, 3400);
  }
  return {
    unlock() {
      const { ctx: ac } = bus();
      if (ac.state === "suspended") void ac.resume();
    },
    setMuted(next) {
      muted = next;
      if (master) master.gain.setTargetAtTime(next ? 0 : 0.8, master.context.currentTime, 0.02);
      if (next) stopLab();
    },
    lab(on) {
      if (on && !muted) startLab();
      else stopLab();
    },
    labOn() {
      return labOn;
    },
    pour() {
      if (muted || !pourBuf) {
        if (!muted) bus();
        if (muted || !pourBuf) return;
      }
      const { ctx: ac, master: out } = bus();
      const src = ac.createBufferSource();
      src.buffer = pourBuf;
      src.playbackRate.value = 0.75 + Math.random() * 0.2;
      const filter = ac.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;
      const g = ac.createGain();
      g.gain.value = 0.45;
      src.connect(filter);
      filter.connect(g);
      g.connect(out);
      src.start();
    },
    select() {
      tone(540, 0.07, "sine", 0.08);
    },
    deny() {
      tone(130, 0.14, "triangle", 0.07);
    },
    cork() {
      tone(220, 0.09, "square", 0.04);
    },
    win() {
      tone(392, 0.4, "sine", 0.08);
      window.setTimeout(() => tone(494, 0.4, "sine", 0.08), 120);
      window.setTimeout(() => tone(587, 0.55, "sine", 0.09), 240);
    }
  };
}
export {
  createMixer
};
