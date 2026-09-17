# Cassino — Rules & How to Play

## 1. Overview

Cassino (Kaszinó) is a classic fishing-style card game played with a
standard 52-card French deck. This is the **Hungarian two-player
variant**: you against the computer, played entirely in the browser.

Cards are taken from a shared table into each player's personal pile by
matching values or combinations. At the end of the deal, piles are
scored, and **whoever earns more points wins**.

## 2. How to Run & Play

### Prerequisites

- Python 3.11+
- [`uv`](https://docs.astral.sh/uv/) (recommended) — or plain `python3`
  and `pip` if `uv` isn't installed. There are no third-party
  dependencies beyond `pytest` for the tests; the web server uses only
  the Python standard library.

### Run the tests

```sh
uv run pytest
```

Without `uv`:

```sh
python3 -m pip install pytest
python3 -m pytest
```

### Launch the web interface

```sh
uv run python -m casino.web
```

Without `uv`:

```sh
python3 -m casino.web
```

This starts a local server. Open your browser to:

```
http://localhost:8765
```

A fresh deal starts automatically. Click **New deal** at any time to
start over.

### Playing a turn

1. Click one or more cards in **your hand** to select what you want to
   play.
2. Optionally click cards on **the table** to select what you want to
   take with them.
3. Click **Play**:
   - No table cards selected → your hand card is **placed** face up on
     the table.
   - Table cards selected → if they're a legal capture, they're taken
     into your pile along with your played card(s).
4. The **Play** button only enables once your selection matches a
   legal move; the status line explains what's currently selected.
5. After your move, the computer plays automatically (its moves are
   logged), and it's your turn again.

## 3. Complete Game Rules

### Cards and values

Ranks: `A 2 3 4 5 6 7 8 9 10 J Q K`, suits: `♠ ♥ ♦ ♣` (S H D C).

| Rank | A | 2–10 | J | Q | K |
|---|---|---|---|---|---|
| Value | 1 | face value | 11 | 12 | 13 |

Note: unlike some Cassino variants, an Ace is **always worth 1**, both
for matching/building and for scoring — there's no "Ace high" option.

### The deal

- Each player is dealt **3 cards**.
- **4 cards** are dealt face up onto the table.
- The rest of the deck becomes the **talon** (face-down stock), drawn
  from later.
- Whoever is dealt first also **leads** (moves first).

### Your turn: capture or place

On your turn you play a non-empty set of cards from your hand and
either take nothing (**placing**) or take a matching set of cards from
the table (**capturing**).

- **Placing**: play exactly **one** card from your hand face up onto
  the table. It joins the pool of table cards available for future
  captures.
- **Capturing**: play one or more cards from your hand and take one or
  more cards from the table, **as long as the total value of what you
  play equals the total value of what you take**. This covers all the
  usual capture patterns:
  - *Matching*: a single card capturing a single card of the same
    value (e.g. a 5 takes a 5).
  - *Building/combinations*: a card capturing several table cards
    whose values sum to it (e.g. a King takes a 4 and a 9, since
    4 + 9 = 13).
  - *Combining from hand*: **more than one hand card** can be played
    together, as long as their combined value matches the combined
    value of the table cards taken (e.g. playing a 5 and an Ace,
    total 6, to take a 4 and a 2, total 6).

You always have the option to place instead of capture, even when a
capture is available.

### Sweeps

If a capture takes **every card currently on the table**, that's a
**sweep**, worth **1 bonus point** at scoring time. The table starts
empty for the next move.

**Placing onto an empty table doesn't end your turn** — since this can
only happen right after a sweep, the same player immediately gets
another move (this repeats until the table isn't empty, or that
player runs out of cards). This compensates for a sweep having left
nothing on the table to react to yet.

### Running out of cards mid-deal

Because multiple hand cards can be played in a single capture, one
player's hand can run out before the other's. When that happens, turns
simply skip to whichever player still has cards to play.

### New rounds

Once **both** players' hands are empty:

- If the talon still has cards, **3 new cards are dealt to each
  player** (the table is *not* redealt — whatever's on it stays there).
  Whoever made the **most recent capture** leads the new round.
- If the talon is also empty, the deal is over (see below).

### End of the deal

The deal ends once both hands and the talon are empty. Any cards still
left on the table at that point are **swept up by whoever made the
last capture** of the deal — even if that capture didn't clear the
whole table. Every one of the 52 cards ends up in exactly one of the
two players' piles.

## 4. Scoring

Scoring happens once per completed deal, comparing the two players'
final piles:

| Bonus | Points | Condition |
|---|---|---|
| **Most cards** | 3 pts | Holding **27 or more** of the 52 cards (a 26–26 split scores nobody) |
| **Most spades** | 2 pts | Holding **7 or more** of the 13 spades |
| **Big Cassino** | 2 pts | Holding the **10 of Diamonds (10D)** |
| **Little Cassino** | 1 pt | Holding the **2 of Spades (2S)** |
| **Aces** | 1 pt each | For **every** Ace held (up to 4 pts total) |
| **Sweeps** | 1 pt each | For every sweep made during the deal |

The player with the higher total wins the deal. Points from most-cards
and most-spades can only go to one player (or neither, on a tie); Big
Cassino, Little Cassino, aces, and sweeps are awarded independently
based on whoever actually holds those specific cards or made those
specific sweeps.
