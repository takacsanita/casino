"""Core rules for the Hungarian two-player Cassino.

A card is a string: rank then suit. Ranks ``A 2 3 4 5 6 7 8 9 10 J Q K``,
suits ``S H D C``.

Capturing is generalised sum-matching: a player plays a non-empty set of
cards from their hand and takes a non-empty set of cards from the table
whose values add up to the same total (a single card matching a single
card of the same rank is just the special case where both sets have one
card). Placing a card is playing exactly one card and taking nothing.

Rules encoded here beyond the obvious capture/place choice:

* A sweep (taking every card on the table) earns the capturing player one
  sweep point, and the table starts the next move empty.
* Turns alternate after every move, *except* that placing a card onto an
  empty table does not end the turn -- the same player immediately moves
  again. In practice this only happens right after a sweep.
* When both hands become empty, if the talon still has cards, three new
  cards are dealt to each player (player 0 first) and the player who most
  recently captured leads the new round. If the talon is empty too, the
  deal is over: any cards left on the table go to whoever captured last.
* Scoring is standard Cassino: 3 points for most cards (>= 27), 2 points
  for most spades (>= 7), 1 point per ace, 2 points for the ten of
  diamonds, 1 point for the two of spades, plus sweep points.
"""
from __future__ import annotations

import itertools
from dataclasses import dataclass
from typing import FrozenSet, Iterable, NamedTuple, Optional, Sequence, Tuple

RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
SUITS = "SHDC"
RANK_VALUES = {rank: i + 1 for i, rank in enumerate(RANKS)}
ALL_CARDS = [rank + suit for suit in SUITS for rank in RANKS]


def value(card: str) -> int:
    """The card's value: A=1, 2..10 face value, J=11, Q=12, K=13."""
    return RANK_VALUES[card[:-1]]


class Move(NamedTuple):
    hand: FrozenSet[str]
    table: FrozenSet[str]


@dataclass(frozen=True)
class State:
    hands: Tuple[Tuple[str, ...], Tuple[str, ...]]
    table: Tuple[str, ...]
    talon: Tuple[str, ...]
    piles: Tuple[Tuple[str, ...], Tuple[str, ...]]
    sweeps: Tuple[int, int]
    player: int
    last_capturer: int


def new_deal(deck: Sequence[str], first: int = 0) -> State:
    """Deal a new hand from ``deck``, the 52 cards in order.

    The first three cards go to player ``first``, the next three to the
    other player, the next four face up on the table, and the rest becomes
    the talon (stock), drawn from the front.
    """
    other = 1 - first
    hands = [(), ()]
    hands[first] = tuple(deck[0:3])
    hands[other] = tuple(deck[3:6])
    table = tuple(deck[6:10])
    talon = tuple(deck[10:])
    return State(
        hands=tuple(hands),
        table=table,
        talon=talon,
        piles=((), ()),
        sweeps=(0, 0),
        player=first,
        last_capturer=first,
    )


def _subsets_summing_to(cards: Sequence[Tuple[str, int]], target: int) -> Iterable[FrozenSet[str]]:
    """Every non-empty subset of ``cards`` (name, value pairs) summing to ``target``."""
    cards = sorted(cards, key=lambda cv: -cv[1])
    n = len(cards)
    chosen: list = []

    def backtrack(i: int, remaining: int):
        if remaining == 0 and chosen:
            yield frozenset(name for name, _ in chosen)
            return
        if i >= n or remaining <= 0:
            return
        name, v = cards[i]
        if v <= remaining:
            chosen.append((name, v))
            yield from backtrack(i + 1, remaining - v)
            chosen.pop()
        yield from backtrack(i + 1, remaining)

    yield from backtrack(0, target)


def legal_moves(state: State) -> FrozenSet[Move]:
    """Every legal move for the player to move."""
    hand = state.hands[state.player]
    moves = set()

    for card in hand:
        moves.add(Move(frozenset({card}), frozenset()))

    table_cv = [(card, value(card)) for card in state.table]
    hand_list = list(hand)
    for r in range(1, len(hand_list) + 1):
        for combo in itertools.combinations(hand_list, r):
            target = sum(value(card) for card in combo)
            for table_subset in _subsets_summing_to(table_cv, target):
                moves.add(Move(frozenset(combo), table_subset))

    return frozenset(moves)


def play(state: State, move: Move) -> State:
    """The state after ``move``. Raises ``ValueError`` if it is not legal."""
    player = state.player
    hand = state.hands[player]
    hand_set = set(hand)

    if not move.hand or not move.hand.issubset(hand_set):
        raise ValueError("cannot play cards that are not in hand")

    if move.table:
        table_set = set(state.table)
        if not move.table.issubset(table_set):
            raise ValueError("cannot take cards that are not on the table")
        if sum(value(c) for c in move.hand) != sum(value(c) for c in move.table):
            raise ValueError("the played cards and taken cards must add up to the same total")
    elif len(move.hand) != 1:
        raise ValueError("placing means playing exactly one card")

    new_hand = tuple(c for c in hand if c not in move.hand)
    hands = list(state.hands)
    hands[player] = new_hand

    piles = list(state.piles)
    sweeps = list(state.sweeps)
    last_capturer = state.last_capturer
    placed_on_empty_table = False

    if move.table:
        new_table = tuple(c for c in state.table if c not in move.table)
        piles[player] = piles[player] + tuple(sorted(move.hand | move.table))
        if not new_table:
            sweeps[player] += 1
        last_capturer = player
    else:
        card = next(iter(move.hand))
        placed_on_empty_table = len(state.table) == 0
        new_table = state.table + (card,)

    hands = tuple(hands)
    talon = state.talon

    if not hands[0] and not hands[1]:
        if len(talon) >= 6:
            hands = (talon[0:3], talon[3:6])
            talon = talon[6:]
        elif new_table:
            piles[last_capturer] = piles[last_capturer] + tuple(sorted(new_table))
            new_table = ()
        next_player = last_capturer
    else:
        if placed_on_empty_table and new_hand:
            next_player = player
        else:
            next_player = 1 - player
        if not hands[next_player]:
            # A multi-card capture can empty one hand before the other;
            # skip straight to whoever still has cards to play.
            next_player = 1 - next_player

    return State(
        hands=hands,
        table=new_table,
        talon=talon,
        piles=tuple(piles),
        sweeps=tuple(sweeps),
        player=next_player,
        last_capturer=last_capturer,
    )


def deal_over(state: State) -> bool:
    """True once every card has been taken."""
    return (
        not state.hands[0]
        and not state.hands[1]
        and not state.talon
        and not state.table
    )


def score(state: State) -> Tuple[int, int]:
    """The points each player earned in the finished deal."""
    points = []
    for p in (0, 1):
        pile = state.piles[p]
        points.append(
            (3 if len(pile) >= 27 else 0)
            + (2 if sum(c.endswith("S") for c in pile) >= 7 else 0)
            + sum(c.startswith("A") for c in pile)
            + (2 if "10D" in pile else 0)
            + (1 if "2S" in pile else 0)
            + state.sweeps[p]
        )
    return tuple(points)
