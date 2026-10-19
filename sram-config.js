/* ------------------------------------------------------------------
   SRAM hero: tune the demo here. No other file needs editing.
   ------------------------------------------------------------------ */

const SRAM_SIM = {
  tickMs: 500,            // one demo "block" read/write cycle, in milliseconds
  flipsPerError: 0.1,     // demo bit flips per measured bit error. Raise to speed everything up.
  maxFlipsPerTick: 24,    // ceiling, so the 128-bit grid doesn't become pure noise
  initialWord: 0xA5A5,    // 16-bit pattern loaded into all 8 addresses
  latchupStuckBits: 4     // bits that freeze in one address when a latchup happens
};

/* Each run is one of your four plots (reactor power steps, in order).
   Every run starts at 0 W (the first level).
   L(label, errorsPerBlock, latchupPerSec)
     errorsPerBlock: average bit errors per block at that power. Estimated by eye
                     from the blue stems in each plot, so adjust freely.
     latchupPerSec:  chance per second of a single-event latchup (0 = never).
                     This is NOT from your plots; it is a made-up demo value. */
const L = (label, errorsPerBlock, latchupPerSec = 0) => ({ label, errorsPerBlock, latchupPerSec });

const SRAM_RUNS = [
  { name: "Run 1", levels: [          // SRAM_1: 0W > 100W > 1KW > 5KW > 0W
    L("0 W", 0), L("100 KW", 0), L("1 MW", 0.3), L("5 MW", 1.8)
  ]},
  { name: "Run 2", levels: [          // SRAM_2: 0W > 5KW > 15KW > 5KW > 0W
    L("0 W", 0), L("5 MW", 0.8), L("15 MW", 2.5)
  ]},
  { name: "Run 3", levels: [          // SRAM_3: 0W > 20KW > 50KW > 100KW > 0W
    L("0 W", 0), L("20 MW", 5), L("50 MW", 15), L("100 MW", 40, 0.004)
  ]},
  { name: "Run 4", levels: [          // SRAM_4: 0W > 100KW > 300KW > 900KW > 0W
    L("0 W", 0), L("100 MW", 100), L("300 MW", 300, 0.005), L("900 MW", 2500, 0.15)
  ]}
];
