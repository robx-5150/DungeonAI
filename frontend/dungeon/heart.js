/*
 * The Dungeon Heart (Phase 1, read-only).
 *
 * The Heart pulses at the centre of the dungeon and speaks to the Master.
 * It only reacts to events; it never sends commands to StarNet.
 *
 * Event source: call DungeonHeart.feed({ type, ... }) with StarNet events.
 * Event names follow docs/CHARACTER_MAPPING.md. Until a live feed is wired,
 * the Heart runs a demo feed so the scene can be reviewed on its own.
 */
(function () {
  const canvas = document.getElementById("heart");
  const ctx = canvas.getContext("2d");
  const line = document.getElementById("heart-line");
  const modeLabel = document.getElementById("heart-mode");

  const COLORS = {
    ember: "#c2452d",
    hot: "#ffb347",
    shadow: "#2a1d33",
    bone: "#d8cbb0",
  };

  // What the Heart says for each StarNet event. Kept short and sinister.
  const LINES = {
    "agent.run.start": [
      "Master, a creature has taken up its post.",
      "Another soul goes to work in the dungeon, Master.",
    ],
    "agent.waiting": [
      "A creature waits on your word, Master.",
      "Something stands idle and wishes to be told what to do.",
    ],
    "agent.run.end": [
      "The task is done, Master. The creature returns to its nest.",
      "Work finished. The dungeon grows a little richer, Master.",
    ],
    "workitem.delivered": [
      "A tribute has been delivered to the outbox, Master.",
    ],
    "cron.fire": [
      "The hour has struck, Master. The dungeon stirs on schedule.",
    ],
  };

  // Demo events so the scene runs without StarNet.
  const DEMO_EVENTS = [
    "agent.run.start",
    "agent.waiting",
    "agent.run.end",
    "workitem.delivered",
    "cron.fire",
  ];

  let pulse = 0;          // drives the heartbeat
  let glow = 0.2;         // brief flare when an event arrives
  let queue = [];         // lines waiting to be typed out
  let typing = null;      // { text, index }
  let idleTimer = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawHeart(t) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const cx = w / 2;
    const cy = h / 2;

    // Heartbeat: a quick double beat every ~1.6 seconds.
    const beat = (t % 1600) / 1600;
    const thump =
      Math.exp(-Math.pow((beat - 0.05) * 14, 2)) * 0.6 +
      Math.exp(-Math.pow((beat - 0.22) * 14, 2)) * 0.4;
    const scale = 1 + thump * 0.09;
    const flare = glow * 0.5;

    ctx.clearRect(0, 0, w, h);

    // Outer glow
    const halo = ctx.createRadialGradient(cx, cy, w * 0.05, cx, cy, w * 0.5);
    halo.addColorStop(0, `rgba(255, 179, 71, ${0.35 + flare})`);
    halo.addColorStop(0.4, `rgba(194, 69, 45, ${0.18 + flare * 0.5})`);
    halo.addColorStop(1, "rgba(11, 8, 16, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Heart body: a rounded organ shape drawn with two lobes.
    const r = w * 0.22 * scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-r * 1.6, r * 0.2, -r * 1.2, -r * 1.1, 0, -r * 0.45);
    ctx.bezierCurveTo(r * 1.2, -r * 1.1, r * 1.6, r * 0.2, 0, r * 0.9);
    ctx.closePath();

    const body = ctx.createRadialGradient(0, -r * 0.2, r * 0.1, 0, 0, r * 1.4);
    body.addColorStop(0, COLORS.hot);
    body.addColorStop(0.45, COLORS.ember);
    body.addColorStop(1, COLORS.shadow);
    ctx.fillStyle = body;
    ctx.shadowColor = COLORS.hot;
    ctx.shadowBlur = 40 + thump * 30 + flare * 60;
    ctx.fill();

    // Veins: a few dark lines across the surface.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(42, 29, 51, 0.7)";
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.2, -r * 0.1);
      ctx.quadraticCurveTo(i * r * 0.4, r * 0.3, i * r * 0.15, r * 0.7);
      ctx.stroke();
    }
    ctx.restore();

    // Floating sparks
    for (let i = 0; i < 12; i++) {
      const phase = (t / 1000 + i * 0.73) % 4;
      const sx = cx + Math.sin(i * 1.9 + t / 1500) * w * 0.38;
      const sy = cy + w * 0.42 - phase * w * 0.2;
      const alpha = Math.max(0, 1 - phase / 4) * 0.7;
      ctx.fillStyle = `rgba(255, 179, 71, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function typeNext() {
    if (typing) return;
    if (queue.length === 0) return;
    typing = { text: queue.shift(), index: 0 };
  }

  function stepTyping() {
    if (!typing) return;
    typing.index += 1;
    line.textContent = typing.text.slice(0, typing.index);
    if (typing.index >= typing.text.length) {
      typing = null;
      idleTimer = 0;
    }
  }

  function say(text) {
    queue.push(text);
    typeNext();
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // Public entry point for StarNet events. Unknown events are ignored.
  function feed(event) {
    if (!event || !event.type) return;
    const options = LINES[event.type];
    glow = 1;
    if (options) say(pick(options));
  }

  function tick(t) {
    drawHeart(t);
    glow = Math.max(0.2, glow * 0.985);

    // Type out the current line about every 45 ms.
    if (typing && Math.floor(t / 45) !== pulse) {
      pulse = Math.floor(t / 45);
      stepTyping();
    }

    // Quiet idle moment: the Heart murmurs now and then.
    idleTimer += 16;
    if (!typing && queue.length === 0 && idleTimer > 9000) {
      idleTimer = 0;
      say("I am listening, Master.");
    }

    requestAnimationFrame(tick);
  }

  // Demo feed: one event every few seconds, only when no live feed is connected.
  function startDemo() {
    modeLabel.textContent = "Demo feed";
    setInterval(() => {
      feed({ type: pick(DEMO_EVENTS) });
    }, 4000);
  }

  window.DungeonHeart = { feed };

  window.addEventListener("resize", resize);
  resize();
  say("Good evening, Master. The dungeon awaits your word.");
  startDemo();
  requestAnimationFrame(tick);
})();
