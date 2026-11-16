# LaserVault Daily ⚡ — Tactical Optics Heist for Reddit Devvit

[![Reddit Devvit](https://img.shields.io/badge/Reddit-Devvit%20Interactive%20Posts-FF4500.svg)](https://redditgameofday2026.devpost.com/)
[![365-Day Solvability](https://img.shields.io/badge/BFS%20Solver-365%2F365%20Verified-10b981.svg)](tests/test_daily_seeds.mjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**LaserVault Daily** is a daily-seeded tactical laser optics puzzle engineered natively for **Reddit's Developer Platform (`Devvit`)** Interactive Posts. Every midnight (`00:00 UTC`), a cryptographic seed generates a fresh vault layout worldwide—guaranteed solvable within par moves via our Breadth-First Search (BFS) solver.

- **Play Live in Browser**: [https://khanhtnq.github.io/laservault-daily/](https://khanhtnq.github.io/laservault-daily/)
- **Devpost Submission**: [`DEVPOST_SUBMISSION.md`](DEVPOST_SUBMISSION.md)

---

## 🚀 Key Capabilities

- **Global 00:00 UTC Daily Seed**: Deterministic xorshift PRNG ensures every Redditor tackles the exact same heist board each day.
- **100% Mathematical Solvability**: Validated across 365 consecutive days (`0.022ms` mean generation latency) in `tests/test_daily_seeds.mjs`.
- **Devvit Redis Streaks & Leaderboards**: 2-way `postMessage` bridge between `src/main.tsx` and the HTML5 Canvas WebView storing daily streaks and par-move rankings in Reddit Redis.
- **Zero-Asset Procedural WebAudio**: Synthesizes tactile mirror clicks, laser hums, and vault breach fanfares in pure WebAudio API.
- **1-Click Reddit Markdown Share**: Generates spoiler-free emoji tactical summaries formatted for subreddit comment threads.

---

## 🧪 Quick Start & Verification

```bash
# Verify 365 consecutive daily seeds via BFS solver
node tests/test_daily_seeds.mjs

# Play standalone WebView locally
# Open docs/index.html or webroot/index.html in any modern browser
```
