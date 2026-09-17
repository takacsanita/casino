"use strict";

const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RED_SUITS = new Set(["H", "D"]);

function parseCard(card) {
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return { rank, suit };
}

function cardSVG(card) {
  const { rank, suit } = parseCard(card);
  const color = RED_SUITS.has(suit) ? "#c0392b" : "#1a1a1a";
  const symbol = SUIT_SYMBOL[suit];
  const corner = `
      <text x="6" y="18" font-size="14" font-family="Georgia, serif" fill="${color}" font-weight="bold">${rank}</text>
      <text x="6" y="32" font-size="14" font-family="Georgia, serif" fill="${color}">${symbol}</text>`;
  return `
    <svg viewBox="0 0 64 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="62" height="88" rx="5" fill="#fff" stroke="#999" stroke-width="1"/>
      <g>${corner}</g>
      <text x="32" y="55" font-size="26" font-family="Georgia, serif" fill="${color}" text-anchor="middle" dominant-baseline="middle">${symbol}</text>
      <g transform="rotate(180 32 45)">${corner}</g>
    </svg>`;
}

function cardBackSVG() {
  return `
    <svg viewBox="0 0 64 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="62" height="88" rx="5" fill="#2b5fa5" stroke="#123a6b" stroke-width="1"/>
      <rect x="7" y="7" width="50" height="76" rx="3" fill="none" stroke="#7fa8d9" stroke-width="2"/>
    </svg>`;
}

function el(tag, className, html) {
  const e = document.createElement("div");
  e.className = className;
  if (html !== undefined) e.innerHTML = html;
  if (tag) e.dataset.tag = tag;
  return e;
}

const state = {
  server: null,
  selectedHand: new Set(),
  selectedTable: new Set(),
};

const $ = (id) => document.getElementById(id);

function sortedEq(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function selectionMatchesALegalMove() {
  if (!state.server || !state.server.legal_moves) return null;
  const hand = [...state.selectedHand];
  const table = [...state.selectedTable];
  if (hand.length === 0) return null;
  return state.server.legal_moves.find(
    (m) => sortedEq(m.hand, hand) && sortedEq(m.table, table)
  ) || null;
}

function render() {
  const s = state.server;
  if (!s) return;

  $("score-you").textContent = s.deal_over ? s.score[0] : "-";
  $("score-computer").textContent = s.deal_over ? s.score[1] : "-";

  $("computer-count").textContent = `(${s.hands[1].length} cards)`;
  const computerHand = $("computer-hand");
  computerHand.innerHTML = "";
  for (let i = 0; i < s.hands[1].length; i++) {
    computerHand.appendChild(el("back", "card back", cardBackSVG()));
  }
  $("computer-pile-count").textContent = s.piles[1].length;

  $("talon-count").textContent = s.talon_count;

  const tableRow = $("table-row");
  tableRow.innerHTML = "";
  for (const card of s.table) {
    const isSelected = state.selectedTable.has(card);
    const c = el(card, "card" + (isSelected ? " selected" : ""), cardSVG(card));
    c.title = card;
    c.addEventListener("click", () => {
      if (s.player !== 0 || s.deal_over) return;
      if (state.selectedTable.has(card)) state.selectedTable.delete(card);
      else state.selectedTable.add(card);
      render();
    });
    tableRow.appendChild(c);
  }

  const playerHand = $("player-hand");
  playerHand.innerHTML = "";
  for (const card of s.hands[0]) {
    const isSelected = state.selectedHand.has(card);
    const c = el(card, "card" + (isSelected ? " selected" : ""), cardSVG(card));
    c.title = card;
    c.addEventListener("click", () => {
      if (s.player !== 0 || s.deal_over) return;
      if (state.selectedHand.has(card)) state.selectedHand.delete(card);
      else state.selectedHand.add(card);
      render();
    });
    playerHand.appendChild(c);
  }
  $("player-pile-count").textContent = s.piles[0].length;

  const match = selectionMatchesALegalMove();
  $("play-move").disabled = !match;

  const status = $("status");
  if (s.deal_over) {
    status.textContent = "Deal over.";
  } else if (s.player !== 0) {
    status.textContent = "Computer is thinking...";
  } else if (state.selectedHand.size === 0) {
    status.textContent = "Your turn: pick a card from your hand.";
  } else if (!match) {
    status.textContent = "That combination isn't a legal move yet.";
  } else if (match.table.length === 0) {
    status.textContent = "Ready to place that card.";
  } else {
    status.textContent = `Ready to capture ${match.table.join(", ")}.`;
  }

  if (s.deal_over) {
    showOverlay(s.score);
  }
}

function log(message) {
  const line = document.createElement("div");
  line.textContent = message;
  const box = $("log");
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function describeMove(who, move) {
  if (move.table.length === 0) {
    return `${who} placed ${move.hand.join(", ")}.`;
  }
  return `${who} played ${move.hand.join(", ")} taking ${move.table.join(", ")}.`;
}

function showOverlay(scoreValue) {
  const overlay = $("overlay");
  overlay.classList.remove("hidden");
  let title;
  if (scoreValue[0] > scoreValue[1]) title = "You win!";
  else if (scoreValue[1] > scoreValue[0]) title = "Computer wins.";
  else title = "It's a tie.";
  $("overlay-title").textContent = title;
  $("overlay-detail").textContent = `You: ${scoreValue[0]}  –  Computer: ${scoreValue[1]}`;
}

function hideOverlay() {
  $("overlay").classList.add("hidden");
}

async function fetchState() {
  const res = await fetch("/api/state");
  state.server = await res.json();
  render();
}

async function newGame() {
  hideOverlay();
  $("log").innerHTML = "";
  state.selectedHand.clear();
  state.selectedTable.clear();
  const res = await fetch("/api/new_game", { method: "POST" });
  state.server = await res.json();
  log("New deal. Your turn.");
  render();
}

async function playMove() {
  const match = selectionMatchesALegalMove();
  if (!match) return;
  const humanMove = { hand: [...state.selectedHand], table: [...state.selectedTable] };
  state.selectedHand.clear();
  state.selectedTable.clear();
  const res = await fetch("/api/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(humanMove),
  });
  if (res.status !== 200) {
    const err = await res.json();
    log(`Error: ${err.error}`);
    return;
  }
  const data = await res.json();
  log(describeMove("You", humanMove));
  for (const move of data.computer_moves || []) {
    log(describeMove("Computer", move));
  }
  state.server = data;
  render();
}

$("new-game").addEventListener("click", newGame);
$("overlay-new-game").addEventListener("click", newGame);
$("clear-selection").addEventListener("click", () => {
  state.selectedHand.clear();
  state.selectedTable.clear();
  render();
});
$("play-move").addEventListener("click", playMove);

fetchState();
