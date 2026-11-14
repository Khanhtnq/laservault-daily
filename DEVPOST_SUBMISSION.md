# LaserVault Daily — Reddit Optics Tactical Heist
**Submission for Reddit's Game of the Day Hackathon ($35,000 Cash)**

## 💎 Project Summary
**LaserVault Daily** is an ultra-polished, daily-seeded tactical optics puzzle built natively for Reddit's Developer Platform (**Devvit**) using Interactive Posts and high-performance HTML5 Canvas / WebAudio. 

Every midnight (00:00 UTC), a new cryptographic daily seed generates a unique security vault puzzle. Players rotate optical mirrors, beam splitters, and phase filters to guide high-energy lasers to the vault's core sensor nodes within par moves.

---

## 🚀 Key Features & Architecture
- **Deterministic UTC Daily Seed:** Generated via linear congruential / xorshift PRNG ensuring all global Reddit players face the exact same tactical board on any given day.
- **100% Solvability Guarantee:** Validated through our BFS backtracking solver across 365 consecutive days with sub-millisecond generation time (`0.022ms` average, strict SLA `< 50ms`).
- **Interactive Post & Devvit Redis Bridge:** Seamless 2-way postMessage between Devvit Custom Post container and WebView. Persists user streaks, par-move scores, and community daily leaderboards using Reddit's native Redis store.
- **Zero-Dependency WebAudio Synthesizer:** Pure procedural synthesis for rotation clicks, laser pulses, and vault breach fanfares. No heavy external assets or slow CDN downloads.
- **Viral Reddit Community Growth:** 1-click export of spoiler-free emoji grids (e.g. Wordle/Heist style) formatted specifically for Reddit markdown comment threads.

---

## 🛠️ Tech Stack & Standards
- **Platform:** Reddit Developer Platform (Devvit v0.11+)
- **Frontend / Engine:** HTML5 Canvas, Vanilla ES2022 JavaScript, WebAudio API
- **Backend / Persistence:** Devvit Redis (`@devvit/public-api`)
- **Verification:** Node.js 365-day seed solvability test suite (`tests/test_daily_seeds.mjs`)
- **Media Asset:** 1920x1080 30fps MP4 gameplay demonstration (`assets/demo_1080p.mp4`)

---

## 🧪 Local Testing & Standalone Play
1. **Run 365-Day Solvability Test:**
   ```bash
   node tests/test_daily_seeds.mjs
   ```
2. **Standalone Browser Play:**
   Simply open `webroot/index.html` in Chrome, Safari, Edge, or Firefox. Works offline with 0 dependencies!

---

## 👤 Author
- **Developer:** Trần Ngọc Quốc Khánh
- **GitHub:** `Khanhtnq` (`<218711032+Khanhtnq@users.noreply.github.com>`)
- **Track:** Best Daily Game ($15,000) / Devvit Interactive Posts
