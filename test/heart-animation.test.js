'use strict';
// Run with: node test/heart-animation.test.js
const assert = require('node:assert/strict');
const { createHeart, beatEnvelope } = require('../src/heart-animation.js');

const heart = createHeart();

// Frames stay inside the production range for a full minute.
for (let t = 0; t < 60; t += 0.01) {
  const f = heart.at(t);
  assert.ok(f.frame >= 0 && f.frame <= 15, 'frame out of range at t=' + t + ': ' + f.frame);
}

// The roll is continuous: the frame advances and wraps once per loop.
assert.equal(heart.at(0).frame, 0);
assert.equal(heart.at(3.999).frame, 15);
assert.equal(heart.at(4.0).frame, 0);

// Scale never exceeds the configured amplitude.
let maxScale = 0;
for (let t = 0; t < 8; t += 0.005) maxScale = Math.max(maxScale, heart.at(t).scale);
assert.ok(maxScale <= 1 + heart.config.beatAmplitude + 1e-9, 'scale above amplitude: ' + maxScale);
assert.ok(maxScale > 1.02, 'beat too weak to read: ' + maxScale);

// The first beat is stronger than the second, and the cycle is quiet between beats.
assert.ok(beatEnvelope(0.06) > beatEnvelope(0.22), 'first beat should be stronger');
assert.ok(beatEnvelope(0.5) < 0.01, 'rest between beats should be quiet');

// Unvalidated states refuse to switch, so nothing shows a guessed frame range.
assert.equal(heart.setState('listening'), false);
assert.equal(heart.state, 'idle');

// Bad configuration fails loudly.
assert.throws(() => createHeart({ frames: 0 }));
assert.throws(() => createHeart({ loopSeconds: -1 }));
assert.throws(() => createHeart({ beatAmplitude: 0.5 }));

console.log('heart-animation: all checks passed');
