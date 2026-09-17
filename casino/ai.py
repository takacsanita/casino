"""A simple computer player for Cassino."""
from .core import Move, State, legal_moves


def choose_move(state: State) -> Move:
    """Capture the biggest combination available; otherwise place low.

    Mirrors the heuristic the test suite itself uses to play a whole deal
    out deterministically, so the computer plays sensibly without needing
    any search.
    """
    moves = legal_moves(state)
    captures = [m for m in moves if m.table]
    if captures:
        return max(
            captures,
            key=lambda m: (len(m.table), sorted(m.table), sorted(m.hand)),
        )
    return min((m for m in moves if not m.table), key=lambda m: sorted(m.hand))
