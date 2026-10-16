/*
 * Dungeon Heart animation controller (pure: no DOM, no canvas, no globals).
 *
 * Produces, for a given time, which frame of the Heart sprite to show and how
 * strongly it should pulse. The renderer draws the frame; this module decides it.
 *
 * Idle is the only state used in the first milestone. Listening, speaking and
 * alert are declared now so the renderer does not change when they arrive, but
 * they stay disabled until their frame ranges are validated.
 */
'use strict';

const DEFAULTS = Object.freeze({
  frames: 16,            // production frame count (manifest: heart)
  loopSeconds: 4,        // one full roll through every frame
  beatSeconds: 1.6,      // one double-beat cycle
  beatAmplitude: 0.035,  // peak extra scale at the strongest beat (3.5%, kept subtle)
  // Roll frame ranges per state. Idle uses the whole loop. Others are placeholders.
  states: {
    idle: { from: 0, to: 15, enabled: true },
    listening: { from: 0, to: 15, enabled: false },
    speaking: { from: 0, to: 15, enabled: false },
    alert: { from: 0, to: 15, enabled: false },
  },
});

function smoothstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

// Double beat over one cycle: a strong beat, a softer second beat, then rest.
// Returns 0..1. Each beat is a short bump; the rest of the cycle is quiet.
function beatEnvelope(phase) {
  const bump = (centre, width) => Math.exp(-Math.pow((phase - centre) / width, 2));
  const first = bump(0.06, 0.035);
  const second = 0.6 * bump(0.22, 0.035);
  return Math.min(1, first + second);
}

function validate(cfg) {
  if (!Number.isInteger(cfg.frames) || cfg.frames < 1) throw new Error('heart: frames must be a positive integer');
  if (!(cfg.loopSeconds > 0)) throw new Error('heart: loopSeconds must be positive');
  if (!(cfg.beatSeconds > 0)) throw new Error('heart: beatSeconds must be positive');
  if (!(cfg.beatAmplitude >= 0 && cfg.beatAmplitude <= 0.2)) throw new Error('heart: beatAmplitude must be between 0 and 0.2');
}

function createHeart(options) {
  const cfg = Object.assign({}, DEFAULTS, options || {}, { states: Object.assign({}, DEFAULTS.states, (options || {}).states || {}) });
  validate(cfg);
  let state = 'idle';

  function setState(name) {
    const range = cfg.states[name];
    if (!range) throw new Error('heart: unknown state ' + name);
    if (!range.enabled) return false;   // not validated yet: refuse rather than show a guess
    state = name;
    return true;
  }

  // t is seconds since start. Returns { frame, scale, beat } for the renderer.
  function at(t) {
    const range = cfg.states[state];
    const span = range.to - range.from + 1;
    const rollPhase = ((t / cfg.loopSeconds) % 1 + 1) % 1;
    const frame = range.from + Math.min(span - 1, Math.floor(smoothstep(rollPhase) * span));
    const beatPhase = ((t / cfg.beatSeconds) % 1 + 1) % 1;
    const beat = beatEnvelope(beatPhase);
    return { frame, scale: 1 + beat * cfg.beatAmplitude, beat, state };
  }

  return { at, setState, get state() { return state; }, config: cfg };
}

module.exports = { createHeart, beatEnvelope, DEFAULTS };
