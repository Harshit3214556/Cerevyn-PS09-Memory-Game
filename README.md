# Flip Eight — Adaptive Memory Matching Game

**Cerevyn Chitkara Round One · PS09**  
A small browser-based memory game that tracks each round and recommends a difficulty for the next one.

> **Candidate:** Harshit · **Roll number:** 2310991303 · **Branch:** CSE

## What it does

- Starts with a 4 × 4 board containing eight pairs.
- Lets the player reveal two cards at a time and prevents a third selection while a mismatch is being resolved.
- Tracks moves, completed pairs and elapsed active time.
- Handles matched-card clicks, repeat selection and restart during a pending mismatch timer.
- Recommends the next round's level using the previous result.
- Saves up to eight anonymous round summaries in the current browser using `localStorage`.
- Includes deterministic seeded shuffling for reproducible tests.

## Difficulty rule

The first round is Easy. After a completed round:

| Previous result | Next round | Reason |
| --- | --- | --- |
| 12 moves or fewer **and** 45 seconds or less | Hard | Strong performance; try a tougher round |
| 22 moves or more **or** over 100 seconds | Easy | More room to practise |
| Anything between those thresholds | Keep the current level | The result is in the middle range |

Both levels keep the required eight pairs and 4 × 4 grid. Easy gives mismatched cards 720 ms to be reviewed; Hard shortens that window to 420 ms, so the board is more demanding without changing the assessment's required grid size.

## Requirements

- Node.js 20 or newer for the automated tests.
- A modern browser with JavaScript modules enabled.
- Python 3 for the optional local static server, or any equivalent static HTTP server.
- No paid API keys, backend database, package installation, or build process is required to play.

## Run locally

From the project folder, start a local server:

```bash
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser. Serving over HTTP avoids browser restrictions some environments apply to JavaScript modules opened directly from a file.

## Run tests

```bash
npm test
```

The test suite uses Node's built-in test runner, so no third-party test dependency is needed.

## Sample test scenarios

| Scenario | Expected behaviour |
| --- | --- |
| Open a new round | 16 cards appear, eight pairs are represented, counters start at zero |
| Reveal two matching cards | Both stay face up and pair progress increases |
| Reveal two non-matching cards | Both remain visible briefly and then turn face down |
| Click rapidly while a mismatch is visible | Further selections are disabled until the two cards reset |
| Restart during the mismatch delay | The old timer is cleared and cannot change the new board |
| Complete in 12 moves and 45 seconds | The next round recommendation becomes Hard |
| Complete in 22 moves or take over 100 seconds | The next round recommendation becomes Easy |
| Clear history | Saved recent-round summaries are removed from this browser |

## GitHub Actions

`.github/workflows/ci.yml` installs Node.js 20 and runs `npm test` on pushes, pull requests and manual runs. After pushing the repository, open the **Actions** tab and link the successful workflow run here: [Add CI run link after first push].

## Azure deployment

See [`docs/azure-plan.md`](docs/azure-plan.md) for the hosting design, setup steps, identity and secret handling, monitoring, and cost assumptions. The intended deployment target is Azure Static Web Apps. A live deployment is optional for this assessment; do not claim it is deployed until you have actually deployed and tested it.

## Demo checklist (3–5 minutes)

1. Open the game and explain the counters and the eight-pair board.
2. Reveal a matching pair, then reveal a mismatch and show that cards turn back over.
3. Start a mismatch and immediately restart to show that the previous timer does not affect the new round.
4. Complete a round and show the recorded result and next-difficulty explanation. For a quick demo of the adaptation rule, use the automated tests to show the threshold behaviour; actual game results depend on play.
5. Run `npm test`, then show the passing GitHub Actions run after the project has been pushed.
6. Briefly explain the Azure Static Web Apps deployment plan.

## Project structure

```text
.
├── index.html
├── styles.css
├── src/
│   ├── app.js
│   └── game.js
├── tests/
│   └── game.test.js
├── sample_data/
│   └── scenarios.json
├── docs/
│   └── azure-plan.md
└── .github/workflows/
    └── ci.yml
```

## Limitations

- Round history is stored only in the current browser; there is no account or cloud synchronisation.
- This is a focused prototype, not a clinical or cognitive assessment tool.
- The game depends on browser JavaScript and local storage support.
- The Google Fonts import is a visual enhancement; if the font service is blocked, the system sans-serif fallback is used.

## Contribution and assistance note

Before submitting, verify the candidate details above, review the implementation, run it yourself, and make sure you can explain the state management, timer cleanup, scoring thresholds and tests. The assessment brief asks candidates to document their own contribution and any reused code or AI assistance. Add an accurate note describing the assistance used and the changes you personally made; do not claim work you did not do.
