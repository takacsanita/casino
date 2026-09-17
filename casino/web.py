"""A zero-dependency HTTP server: the JSON API plus the static browser app.

Run with ``python3 -m casino.web`` (or ``uv run python -m casino.web``).
Keeps one game in memory for the process; the human is always player 0,
the computer is player 1.
"""
from __future__ import annotations

import json
import random
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from .ai import choose_move
from .core import ALL_CARDS, Move, State, deal_over, legal_moves, new_deal, play, score

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_lock = threading.Lock()
_game: dict = {"state": None}


def _fresh_deal() -> State:
    deck = list(ALL_CARDS)
    random.SystemRandom().shuffle(deck)
    return new_deal(deck, first=0)


def _move_to_json(move: Move) -> dict:
    return {"hand": sorted(move.hand), "table": sorted(move.table)}


def _stats(state: State) -> list[dict]:
    """Per-player breakdown behind the score, for the live stats panel.

    Mirrors the point conditions in ``casino.core.score`` but exposes the
    raw counts too, since ``score`` itself only returns the point totals.
    """
    stats = []
    for p in (0, 1):
        pile = state.piles[p]
        stats.append(
            {
                "cards": len(pile),
                "spades": sum(c.endswith("S") for c in pile),
                "aces": sum(c.startswith("A") for c in pile),
                "big_cassino": "10D" in pile,
                "little_cassino": "2S" in pile,
                "sweeps": state.sweeps[p],
            }
        )
    return stats


def _state_to_json(state: State) -> dict:
    over = deal_over(state)
    data = {
        "hands": [list(state.hands[0]), list(state.hands[1])],
        "table": list(state.table),
        "talon_count": len(state.talon),
        "piles": [list(state.piles[0]), list(state.piles[1])],
        "sweeps": list(state.sweeps),
        "player": state.player,
        "deal_over": over,
        # score() is a pure function of piles/sweeps, so it's just as valid
        # as a running estimate mid-deal as it is once the deal is over.
        "score": list(score(state)),
        "stats": _stats(state),
    }
    if not over and state.player == 0:
        data["legal_moves"] = [_move_to_json(m) for m in legal_moves(state)]
    return data


def _play_computer_turns(state: State) -> tuple[State, list[dict]]:
    computer_moves = []
    while not deal_over(state) and state.player == 1:
        move = choose_move(state)
        computer_moves.append(_move_to_json(move))
        state = play(state, move)
    return state, computer_moves


class Handler(BaseHTTPRequestHandler):
    server_version = "CassinoHTTP/1.0"

    def log_message(self, format, *args):  # quieter default logging
        pass

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path, content_type: str) -> None:
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802 (http.server naming convention)
        path = urlparse(self.path).path
        if path == "/api/state":
            with _lock:
                if _game["state"] is None:
                    _game["state"] = _fresh_deal()
                self._send_json(_state_to_json(_game["state"]))
            return
        if path in ("/", "/index.html"):
            self._send_file(STATIC_DIR / "index.html", "text/html; charset=utf-8")
            return
        if path == "/app.js":
            self._send_file(STATIC_DIR / "app.js", "application/javascript; charset=utf-8")
            return
        if path == "/style.css":
            self._send_file(STATIC_DIR / "style.css", "text/css; charset=utf-8")
            return
        self._send_json({"error": "not found"}, status=404)

    def do_POST(self):  # noqa: N802
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}

        if path == "/api/new_game":
            with _lock:
                _game["state"] = _fresh_deal()
                self._send_json(_state_to_json(_game["state"]))
            return

        if path == "/api/move":
            with _lock:
                state = _game["state"]
                if state is None:
                    self._send_json({"error": "no game in progress"}, status=400)
                    return
                move = Move(
                    frozenset(payload.get("hand", [])),
                    frozenset(payload.get("table", [])),
                )
                try:
                    state = play(state, move)
                except ValueError as exc:
                    self._send_json({"error": str(exc)}, status=400)
                    return
                state, computer_moves = _play_computer_turns(state)
                _game["state"] = state
                result = _state_to_json(state)
                result["computer_moves"] = computer_moves
                self._send_json(result)
            return

        self._send_json({"error": "not found"}, status=404)


def main() -> None:
    port = 8765
    server = ThreadingHTTPServer(("localhost", port), Handler)
    print(f"Cassino running at http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
