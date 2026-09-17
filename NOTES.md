# Development Notes & History
---

## 1. Project Initialization & Context

* **Goal:** Build the two-player Cassino game (Player vs. Computer) in a web browser using Python, HTML/CSS/JS, VS Code, and Claude Code.
* **Base Repository:** Fork of `esst-prog2/casino`.
* **Testing Requirement:** All tests in `tests/test_casino.py` must pass cleanly without modifying the test file.
* **Environment Setup:** Python with standard `pip` and `pytest` (`python3 -m pytest` or `pytest`), instead of `uv`.
* **Documentation Strategy:** Maintain `CLAUDE.md` for AI agent memory, `RULES.md` for gameplay and setup guidelines, and `NOTES.md` for tracking modifications and prompt history.

---

## 2. Summary of Prompts Provided to Claude Code

### Task 1: Architecture & Core Implementation
* **Objective:** Instructed Claude Code to scan the repo, create `CLAUDE.md`, implement the `casino` package to pass all tests, and build the browser UI.
* **Key Requirements:**
  * Implement functions: `value()`, `Move()`, `new_deal()`, `legal_moves()`, `play()`, `deal_over()`, and `score()`.
  * Ensure the state object contains: `hands`, `table`, `talon`, `piles`, `sweeps`, and `player`.
  * Run tests using `pytest` (installing dependencies via `pip install pytest`) and fix issues until all tests pass.
  * Build a web interface with SVG cards for a full human vs. computer deal.

### Task 2: Gameplay & Setup Documentation (`RULES.md`)
* **Objective:** Instructed Claude Code to generate a detailed English user guide.
* **Key Requirements:**
  * Document game goals and rules (capturing cards, sums, face cards, sweeps).
  * Provide instructions for launching the web server and accessing the game on `localhost`.
  * Provide the complete scoring breakdown (most cards, most diamonds, Big/Little Cassino, Aces, sweeps).

## Task 3: In-Game Rules Guide & Multi-Language Support (EN/HU)
* **Objective:** Instructed Claude Code to enhance the web UI with interactive rules and language toggling.
* **Key Requirements:**
  * Add an in-game rules guide/modal accessible at any point during gameplay detailing rules, card values, and scoring.
  * Implement a language switch (English / Hungarian) that updates all UI elements, status text, move logs, scoring, and the rules panel in real-time.
  * Ensure `CLAUDE.md` and `RULES.md` are updated accordingly and all `pytest` tests pass.

### Task 4: Continuous / Live Score Display Fix
* **Objective:** Instructed Claude Code to fix the live score calculation and updating on the UI.
* **Key Requirements:**
  * Fix the UI so scores/stats (captured cards, sweeps, aces, diamonds, current deal points) update in real-time after every move.
  * Ensure final score displays correctly upon deal completion (`deal_over`).
  * Ensure live score texts support both English and Hungarian localization.
  * Verify that core logic tests (`python3 -m pytest`) continue to pass.

  ### Task 5: Suit Symbols UI Fix (Diamonds & Spades)
* **Objective:** Instructed Claude Code to replace placeholder symbols for card suits with proper suit icons.
* **Key Requirements:**
  * Replace placeholder characters with proper Spade (♠) and Diamond (♦) suit symbols or SVG/HTML entities.
  * Ensure consistent color coding (red for Diamonds, black for Spades) across the game board, logs, scoring panel, and rules modal.
  * Verify dual-language compatibility and test pass status.