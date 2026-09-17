# Cassino

Hungarian two-player Cassino (52-card French deck), playable in the browser
against the computer. See `README.md` for the original brief and the
`casino` module's public interface.

## Project structure

```
casino/
  __init__.py   re-exports the public interface (value, Move, new_deal, ...)
  core.py       all game rules (pure, no I/O)
  ai.py         computer player: picks a move given a state
  web.py        zero-dependency HTTP server exposing the game as JSON, serves static/
static/
  index.html, app.js, style.css   the browser table (vanilla JS, inline SVG cards)
tests/
  test_casino.py   DO NOT MODIFY. The spec. `casino/core.py` is written to satisfy it.
```

## Commands

```sh
uv run pytest              # run the test suite (falls back: python3 -m pytest)
uv run python -m casino.web   # start the web app on http://localhost:8765
```

`uv` isn't installed in this environment; `python3 -m pytest` and
`python3 -m casino.web` work identically (pytest is already available
globally). No third-party dependencies are used anywhere (`pyproject.toml`
keeps `dependencies = []`) — the web server uses only `http.server` from
the standard library.

## Game rules, as implemented

A card is `"<rank><suit>"`, ranks `A 2 3 4 5 6 7 8 9 10 J Q K` (values 1-13,
so face cards are NOT capped at 10 in this variant), suits `S H D C`.

**Capturing is generalised sum-matching**, not just rank-matching: a move
plays a non-empty subset of the mover's hand and takes a non-empty subset
of the table, legal whenever `sum(value(card) for card in hand-subset) ==
sum(value(card) for card in table-subset)`. A single card capturing a
single same-rank card, or a card capturing a build that sums to it, are
both just instances of this one rule. **Multiple hand cards can be played
in a single capture** (e.g. a 5 and an Ace together, value 6, taking two
table cards that sum to 6) — this means one player's hand can empty
before the other's; see "turn order" below.

**Placing** a card (`Move(hand={card}, table=frozenset())`) always plays
exactly one card face up on the table; never more.

**Sweeps**: capturing every card on the table earns the capturing player
one sweep point (`state.sweeps`); the table starts the next move empty.

**Turn order** — turns normally alternate after every move, with two
exceptions, both needed because a hand can be emptied unevenly by a
multi-card capture:
1. Placing a card onto an *empty* table does not end the turn — the same
   player moves again immediately (this happens in practice right after a
   sweep). Only applies if that player still has a card left to play.
2. If whoever would move next has an empty hand (because an earlier
   multi-card capture ran their hand out first) while the other player
   still holds cards, the turn skips straight to the player who can
   actually move.

**Round renewal**: once both hands are simultaneously empty, if the talon
still has cards, three new cards are dealt to each player (`hands[0]`
gets the next three off the talon, `hands[1]` the three after that,
regardless of who is about to lead) and whoever captured most recently
leads the new round. The table is *not* redealt — whatever's on it stays.

**End of deal**: once both hands are empty and the talon is also empty,
the deal is over. Any cards still on the table at that point go to
whoever captured last (`state.last_capturer`, an internal field alongside
the six documented ones, defaulting to the deal's first player if no
capture ever happened). `deal_over(state)` is then `True` (hands, table
and talon all empty).

**Scoring** (`score`), standard Cassino: 3 points for most cards (>= 27,
nobody scores this on a 26-26 split), 2 points for most spades (>= 7),
1 point per ace held, 2 points for the ten of diamonds, 1 point for the
two of spades, plus each player's sweep points.

`State` (in `casino/core.py`) carries the six fields the tests read
(`hands`, `table`, `talon`, `piles`, `sweeps`, `player`) plus one internal
field, `last_capturer`, used for round-renewal and end-of-deal cleanup.

## Card assets

Card faces are drawn as inline SVG generated in `static/app.js` (rank +
suit glyph, red/black), not downloaded image files — this keeps the app
fully offline/self-contained. The README's suggestion (Byron Knoll's
public-domain deck on Wikimedia Commons) is a fine drop-in replacement if
real card art is wanted later; swap the card-rendering function in
`app.js` for `<img>` tags pointing at those SVGs.

## Web app

`casino/web.py` runs a tiny stdlib HTTP server. It keeps one game `State`
server-side per process (single-player-vs-computer, no accounts), exposes:

- `GET  /api/state` — current state as JSON: `hands`, `table`,
  `talon_count`, `piles`, `sweeps`, `player`, `deal_over`, plus `score`
  and `stats` (see below) on *every* response, and `legal_moves` only
  when it's the human's turn and the deal isn't over
- `POST /api/new_game` — starts a fresh deal
- `POST /api/move` — `{"hand": [...], "table": [...]}`, applies the
  human's move, then lets the computer play until it's the human's turn
  again or the deal ends
- computer moves are chosen by `casino/ai.py`: capture the largest
  combination available when a capture exists, otherwise place the
  lowest-value card — mirrors the test suite's own `choose()` heuristic.

`score` and `stats` are always present, not just once `deal_over` is
true: `casino.core.score()` is a pure function of `piles`/`sweeps` with
no dependency on the deal having ended, so `_state_to_json` in `web.py`
calls it unconditionally and the frontend gets a live running score
after every move. `stats` (built by `_stats()` in `web.py`) is a
per-player breakdown behind those points — raw counts (`cards`,
`spades`, `aces`, `sweeps`) plus booleans (`big_cassino`, `little_cassino`)
for the two named cards — since `score()` itself only returns the two
point totals, not what earned them. If the scoring rules ever change,
update `_stats()` alongside `score()` so the breakdown stays consistent
with the totals it explains.

`static/index.html` polls/calls these endpoints and renders hands, table,
piles and scores; clicking a hand card selects it, clicking table cards
toggles them into the pending capture set, and a "Play" button submits
the move (or places the card alone if no table cards are selected).

### Live score & stats panel

The header score (`#score-you`/`#score-computer`) and the `#stats-area`
breakdown table are populated straight from every `/api/state` and
`/api/move` response's `score`/`stats` fields, in `render()`/
`renderStats()` in `app.js` — no special-casing for `deal_over`, since
the backend already sends real numbers throughout the deal, not just at
the end. `#score-status` just swaps a "(current standings)"/"(final)"
label (`scoreLive`/`scoreFinal` translation keys) depending on
`deal_over`, purely as a hint to the player that the deal is still in
progress; the numbers themselves and their update mechanism don't change.

## In-game rules panel

A "Rules" button in the header opens `#rules-modal`, a dismissible overlay
(close button, backdrop click, all restyled off `.modal-backdrop`/
`.modal-box` in `style.css`) summarising how to play, card values/special
mechanics, and the scoring table. Its content lives in `RULES_EN`/`RULES_HU`
(HTML strings) at the top of `app.js` and is re-rendered on demand by
`renderRules()`, so it always reflects the current language.

The header's `z-index: 60` deliberately keeps it stacked above
`.modal-backdrop` (`z-index: 50`) — without that, the language toggle
would be unreachable while the rules panel is open, since the backdrop
covers the full viewport.

## Language support (English / Hungarian)

All UI copy — static labels, dynamic status text, the move log, the
win/lose overlay, and the rules panel — is driven by the `TRANSLATIONS`
table in `app.js` (keys `en`/`hu`) via a `t(key, ...args)` helper; entries
are either plain strings or functions for text with interpolated values
(card names, scores, etc.).

- Static markup carries `data-i18n="key"` attributes (see `index.html`);
  `applyStaticTranslations()` sweeps them on every render and language
  switch.
- The move log is **not** stored as rendered text — each entry is kept as
  `{key, args}` in `state.logEntries` and the whole log is rebuilt from
  translations by `renderLog()`. This is what lets switching languages
  mid-game retranslate every past log line instantly, not just new ones.
- The current language is persisted to `localStorage` (`cassino-lang`,
  guarded with try/catch since it's a per-viewer convenience, never load-
  bearing) and defaults to English.
- Card codes themselves (`"10D"`, `"AS"`) are never translated — only the
  surrounding phrase.

To add a UI string: add the key to both `TRANSLATIONS.en` and
`TRANSLATIONS.hu`, then either tag a static element with
`data-i18n="key"` or call `t("key", ...)` from `render()`/`logMove()`.
To add a language: add a new top-level key to `TRANSLATIONS` with every
existing key translated, and a matching `<button class="lang-btn"
data-lang="xx">` in the header.
