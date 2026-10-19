/* SRAM hero logic. Rates and settings live in sram-config.js. */
(() => {
  const { tickMs, flipsPerError, maxFlipsPerTick, initialWord, latchupStuckBits } = SRAM_SIM;
  const $ = id => document.getElementById(id);
  const rowsEl = $("sram-rows");
  if (!rowsEl) return;

  const ROWS = 4, WORDS_PER_ROW = 2, BITS = 16, MASK = 0xFFFF;
  const N = ROWS * WORDS_PER_ROW;
  const rnd = n => Math.floor(Math.random() * n);
  const hex = v => "0x" + v.toString(16).toUpperCase().padStart(4, "0");
  const poisson = l => {
    if (l <= 0) return 0;
    const limit = Math.exp(-l);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > limit);
    return k - 1;
  };

  /* Build 4 rows. Each row = 4 bytes of bits (two 16-bit words back to back),
     followed by the two hex readouts. */
  const bitEls = [], hexEls = [];
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement("div");
    row.className = "sram-row";
    const bitsBox = document.createElement("span");   // holds all 4 bytes
    bitsBox.className = "bits";
    const hexBox = document.createElement("span");    // holds both hex words
    hexBox.className = "hexes";
    for (let w = 0; w < WORDS_PER_ROW; w++) {
      const bits = [];
      for (let by = 1; by >= 0; by--) {
        const byte = document.createElement("span");
        byte.className = "byte";
        for (let b = 7; b >= 0; b--) {
          const el = document.createElement("span");
          el.className = "bit";
          bits[by * 8 + b] = el;
          byte.appendChild(el);
        }
        bitsBox.appendChild(byte);
      }
      const h = document.createElement("span");
      h.className = "hex";
      hexBox.appendChild(h);
      bitEls.push(bits);
      hexEls.push(h);
    }
    row.appendChild(bitsBox);
    row.appendChild(hexBox);
    rowsEl.appendChild(row);
  }

  /* State */
  let expected, actual, stuck, upsets, timer = null;
  let run = 0, level = 0;                 // every run starts at 0 W

  const reset = () => {
    expected = Array(N).fill(initialWord);
    actual = expected.slice();
    stuck = Array(N).fill(0);
    upsets = 0;
  };
  reset();

  const lv = () => SRAM_RUNS[run].levels[level];

  const render = () => {
    for (let a = 0; a < N; a++) {
      const diff = actual[a] ^ expected[a];
      for (let b = 0; b < BITS; b++) {
        const el = bitEls[a][b];
        el.textContent = (actual[a] >>> b) & 1;
        el.classList.toggle("err", ((diff >>> b) & 1) === 1);
      }
      hexEls[a].textContent = hex(actual[a]);
    }
    $("sram-count").textContent = upsets + (upsets === 1 ? " upset" : " upsets");
  };

  const setMsg = t => { $("sram-msg").textContent = t; };

  const labels = () => {
    const on = timer !== null;
    $("sram-reactor").textContent = on ? "Reactor Off" : "Reactor On";
    $("sram-reactor").classList.toggle("on", on);
    $("sram-state").textContent = on ? "Reactor on" : "Reactor off";
    $("sram-level-val").textContent = lv().label;
    $("sram-power").textContent = on ? lv().label : "0 W";
    $("sram-steps").textContent = SRAM_RUNS[run].name + " power levels: " +
      SRAM_RUNS[run].levels.map(l => l.label).join(", ");
    document.querySelectorAll(".seg").forEach((s, i) => s.setAttribute("aria-pressed", i === run));
  };

  const tick = () => {
    const l = lv();
    const n = poisson(Math.min(l.errorsPerBlock * flipsPerError, maxFlipsPerTick));
    for (let i = 0; i < n; i++) {
      const a = rnd(N), b = rnd(BITS);
      if ((stuck[a] >>> b) & 1) continue;     // latched bits can't change
      actual[a] ^= 1 << b;
      upsets++;
    }
    if (Math.random() < l.latchupPerSec * tickMs / 1000) {
      const a = rnd(N);
      for (let i = 0; i < latchupStuckBits; i++) stuck[a] |= 1 << rnd(BITS);
    }
    render();
  };

  /* Controls */
  $("sram-reactor").onclick = () => {
    if (timer === null) {
      timer = setInterval(tick, tickMs);
      setMsg(level === 0
        ? "Reactor on at 0 W. Press Power level to raise the reactor power."
        : "Reactor on. Upsets appear at the measured rate for this power.");
    } else {
      clearInterval(timer);
      timer = null;
      setMsg("Reactor off. Flipped bits stay wrong until the memory is written again.");
    }
    labels();
  };

  $("sram-level").onclick = () => {
    level = (level + 1) % SRAM_RUNS[run].levels.length;
    labels();
  };

  $("sram-comp").onclick = () => {
    let bad = 0;
    for (let a = 0; a < N; a++) {
      expected[a] = ~expected[a] & MASK;
      actual[a] = (actual[a] & stuck[a]) | (expected[a] & ~stuck[a] & MASK);
      let d = actual[a] ^ expected[a];
      while (d) { bad += d & 1; d >>>= 1; }
    }
    setMsg(bad
      ? `Latchup detected: ${bad} bits did not follow the complement. Power cycle to clear.`
      : "Complement written. Every bit followed, so no latchup this pass.");
    render();
  };

  $("sram-cycle").onclick = () => {
    reset();
    setMsg("Power cycled. Latchups cleared and the test pattern reloaded.");
    render();
  };

  const runsEl = $("sram-runs");
  SRAM_RUNS.forEach((r, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "seg";
    b.textContent = r.name;
    b.onclick = () => { run = i; level = 0; labels(); };   // each test starts at 0 W
    runsEl.appendChild(b);
  });

  labels();
  render();
})();
