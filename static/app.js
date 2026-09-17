"use strict";

const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RED_SUITS = new Set(["H", "D"]);

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// Renders a card code ("10D", "AS") as rank + a properly coloured suit
// glyph (♠ ♥ ♦ ♣) instead of the raw letter suit code, for use anywhere a
// card is mentioned in running text (move log, status line): matches the
// black/red suit colouring already used on the card faces themselves.
function fmtCard(card) {
  const { rank, suit } = parseCard(card);
  const cls = RED_SUITS.has(suit) ? "suit-red" : "suit-black";
  return `${rank}<span class="${cls}">${SUIT_SYMBOL[suit]}</span>`;
}

function fmtCards(cards) {
  return cards.map(fmtCard).join(", ");
}

// --- translations -----------------------------------------------------

const RULES_EN = `
  <h2>Rules &amp; Scoring</h2>
  <h3>How to play</h3>
  <ul>
    <li>On your turn, play one or more cards from your hand.</li>
    <li><strong>Capture</strong>: select table cards whose total value equals
      the total value of the hand cards you play &mdash; a single card
      matching a same-value card, a card taking several cards that sum to
      it, or even several hand cards played together to match a
      combination.</li>
    <li><strong>Place</strong>: with no table cards selected, your one
      played card is laid face up on the table for later.</li>
  </ul>
  <h3>Card values &amp; special rules</h3>
  <ul>
    <li>Ace = 1, 2&ndash;10 = face value, Jack = 11, Queen = 12, King = 13.</li>
    <li><strong>Sweep</strong>: capturing every card on the table earns a
      bonus point and empties the table.</li>
    <li>Placing onto an empty table (right after a sweep) doesn't end your
      turn &mdash; you move again immediately.</li>
    <li>When both hands are empty and the talon still has cards, 3 new
      cards are dealt to each player; the last player to capture leads.</li>
    <li>When the deal ends, any cards left on the table go to whoever
      captured last.</li>
  </ul>
  <h3>Scoring (per deal)</h3>
  <ul>
    <li>Most cards (27+): 3 pts</li>
    <li>Most spades (7+): 2 pts</li>
    <li>Big Cassino, 10<span class="suit-red">&#9830;</span>: 2 pts</li>
    <li>Little Cassino, 2<span class="suit-black">&#9824;</span>: 1 pt</li>
    <li>Each Ace held: 1 pt (up to 4)</li>
    <li>Each sweep: 1 pt</li>
  </ul>`;

const RULES_HU = `
  <h2>Szab&aacute;lyok &eacute;s pontoz&aacute;s</h2>
  <h3>Hogyan j&aacute;tssz</h3>
  <ul>
    <li>A k&ouml;r&ouml;d elej&eacute;n egy vagy t&ouml;bb lapot j&aacute;tszol
      ki a kezedb&#337;l.</li>
    <li><strong>Begy&#369;jt&eacute;s</strong>: olyan asztali lapokat
      jel&ouml;lsz ki, amelyek &eacute;rt&eacute;keinek &ouml;sszege
      megegyezik a kij&aacute;tszott k&eacute;zi lapok
      &eacute;rt&eacute;k&ouml;sszeg&eacute;vel &mdash; legyen sz&oacute; egy
      azonos &eacute;rt&eacute;k&#369; lapr&oacute;l, egy lapr&oacute;l, amely
      t&ouml;bb lap &ouml;sszeg&eacute;t fedi, vagy ak&aacute;r t&ouml;bb
      k&eacute;zi lapr&oacute;l egy&uuml;tt kij&aacute;tszva.</li>
    <li><strong>Lerak&aacute;s</strong>: ha nem jel&ouml;lsz ki asztali
      lapot, az egyetlen kij&aacute;tszott lapod felfel&eacute; ford&iacute;tva
      ker&uuml;l az asztalra, k&eacute;s&#337;bb begy&#369;jthet&#337;.</li>
  </ul>
  <h3>Lap&eacute;rt&eacute;kek &eacute;s k&uuml;l&ouml;nleges szab&aacute;lyok</h3>
  <ul>
    <li>&Aacute;sz = 1, 2&ndash;10 = n&eacute;v&eacute;rt&eacute;k, Bubi (J) =
      11, D&aacute;ma (Q) = 12, Kir&aacute;ly (K) = 13.</li>
    <li><strong>Sepr&eacute;s</strong>: ha egy begy&#369;jt&eacute;ssel az
      asztal &ouml;sszes lapj&aacute;t elviszed, b&oacute;nuszpontot kapsz,
      &eacute;s az asztal ki&uuml;r&uuml;l.</li>
    <li>Ha &uuml;res asztalra raksz le lapot (k&ouml;zvetlen&uuml;l
      sepr&eacute;s ut&aacute;n), a k&ouml;r&ouml;d nem &eacute;r v&eacute;get
      &mdash; azonnal &uacute;jra l&eacute;psz.</li>
    <li>Amikor mindk&eacute;t k&eacute;z ki&uuml;r&uuml;l &eacute;s a
      h&uacute;z&oacute;pakliban m&eacute;g van lap, mindk&eacute;t
      j&aacute;t&eacute;kos kap 3 &uacute;j lapot; az kezd, aki legut&oacute;bb
      gy&#369;jt&ouml;tt.</li>
    <li>A parti v&eacute;g&eacute;n az asztalon maradt lapokat az kapja, aki
      utolj&aacute;ra gy&#369;jt&ouml;tt.</li>
  </ul>
  <h3>Pontoz&aacute;s (partink&eacute;nt)</h3>
  <ul>
    <li>Legt&ouml;bb lap (27+): 3 pont</li>
    <li>Legt&ouml;bb pikk (7+): 2 pont</li>
    <li>Nagy kaszin&oacute;, 10<span class="suit-red">&#9830;</span>: 2 pont</li>
    <li>Kis kaszin&oacute;, 2<span class="suit-black">&#9824;</span>: 1 pont</li>
    <li>Minden birtokolt &aacute;sz: 1 pont (max. 4)</li>
    <li>Minden sepr&eacute;s: 1 pont</li>
  </ul>`;

const TRANSLATIONS = {
  en: {
    title: "Cassino",
    you: "You",
    computer: "Computer",
    newDeal: "New deal",
    clear: "Clear",
    play: "Play",
    rules: "Rules",
    talon: "Talon",
    pile: "Pile",
    cardsCount: (n) => `(${n} card${n === 1 ? "" : "s"})`,
    yourTurnPick: "Your turn: pick a card from your hand.",
    computerThinking: "Computer is thinking...",
    notLegal: "That combination isn't a legal move yet.",
    readyToPlace: "Ready to place that card.",
    readyToCapture: (cards) => `Ready to capture ${fmtCards(cards)}.`,
    dealOver: "Deal over.",
    newDealLog: "New deal. Your turn.",
    youPlaced: (cards) => `You placed ${fmtCards(cards)}.`,
    youCaptured: (hand, table) => `You played ${fmtCards(hand)} taking ${fmtCards(table)}.`,
    computerPlaced: (cards) => `Computer placed ${fmtCards(cards)}.`,
    computerCaptured: (hand, table) => `Computer played ${fmtCards(hand)} taking ${fmtCards(table)}.`,
    youWin: "You win!",
    computerWins: "Computer wins.",
    tie: "It's a tie.",
    scoreDetail: (you, comp) => `You: ${you} – Computer: ${comp}`,
    playAgain: "Play again",
    error: (msg) => `Error: ${escapeHtml(msg)}`,
    rulesHtml: RULES_EN,
    scoreLive: "(current standings)",
    scoreFinal: "(final)",
    statsTitle: "Score breakdown",
    statCards: "Cards",
    statSpades: "Spades",
    statAces: "Aces",
    statBigCassino: "Big Cassino",
    statLittleCassino: "Little Cassino",
    statSweeps: "Sweeps",
    statPoints: "Points",
  },
  hu: {
    title: "Kaszinó",
    you: "Te",
    computer: "Gép",
    newDeal: "Új parti",
    clear: "Törlés",
    play: "Lejátszás",
    rules: "Szabályok",
    talon: "Húzópakli",
    pile: "Lapok",
    cardsCount: (n) => `(${n} lap)`,
    yourTurnPick: "Te következel: válassz egy lapot a kezedből.",
    computerThinking: "A gép gondolkodik…",
    notLegal: "Ez a kombináció még nem érvényes lépés.",
    readyToPlace: "Készen állsz a lap lerakására.",
    readyToCapture: (cards) => `Készen állsz begyűjteni: ${fmtCards(cards)}.`,
    dealOver: "A parti véget ért.",
    newDealLog: "Új parti. Te következel.",
    youPlaced: (cards) => `Lerakva: ${fmtCards(cards)}.`,
    youCaptured: (hand, table) => `Játszva: ${fmtCards(hand)} — begyűjtve: ${fmtCards(table)}.`,
    computerPlaced: (cards) => `A gép lerakta: ${fmtCards(cards)}.`,
    computerCaptured: (hand, table) => `A gép játszotta: ${fmtCards(hand)} — begyűjtve: ${fmtCards(table)}.`,
    youWin: "Nyertél!",
    computerWins: "A gép nyert.",
    tie: "Döntetlen.",
    scoreDetail: (you, comp) => `Te: ${you} – Gép: ${comp}`,
    playAgain: "Új játék",
    error: (msg) => `Hiba: ${escapeHtml(msg)}`,
    rulesHtml: RULES_HU,
    scoreLive: "(jelenlegi állás)",
    scoreFinal: "(végeredmény)",
    statsTitle: "Pontösszesítő",
    statCards: "Lapok",
    statSpades: "Pikk",
    statAces: "Ászok",
    statBigCassino: "Nagy kaszinó",
    statLittleCassino: "Kis kaszinó",
    statSweeps: "Seprések",
    statPoints: "Pontok",
  },
};

function loadLang() {
  try {
    const saved = localStorage.getItem("cassino-lang");
    if (saved === "en" || saved === "hu") return saved;
  } catch (e) {
    /* ignore unavailable storage */
  }
  return "en";
}

function saveLang(lang) {
  try {
    localStorage.setItem("cassino-lang", lang);
  } catch (e) {
    /* ignore unavailable storage */
  }
}

// --- card rendering -----------------------------------------------------

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

// --- app state ------------------------------------------------------------

const state = {
  server: null,
  selectedHand: new Set(),
  selectedTable: new Set(),
  lang: loadLang(),
  logEntries: [], // { key: string, args: [...] }
};

const $ = (id) => document.getElementById(id);

function t(key, ...args) {
  const entry = TRANSLATIONS[state.lang][key];
  return typeof entry === "function" ? entry(...args) : entry;
}

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

// --- rendering --------------------------------------------------------

function applyStaticTranslations() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state.lang);
  });
}

function renderLog() {
  const box = $("log");
  box.innerHTML = "";
  for (const entry of state.logEntries) {
    const line = document.createElement("div");
    line.innerHTML = t(entry.key, ...entry.args);
    box.appendChild(line);
  }
  box.scrollTop = box.scrollHeight;
}

function logMove(who, move) {
  const key = move.table.length === 0
    ? (who === "you" ? "youPlaced" : "computerPlaced")
    : (who === "you" ? "youCaptured" : "computerCaptured");
  const args = move.table.length === 0
    ? [move.hand]
    : [move.hand, move.table];
  state.logEntries.push({ key, args });
  renderLog();
}

function logPlain(key) {
  state.logEntries.push({ key, args: [] });
  renderLog();
}

const CHECK_MARK = "✓";
const NO_MARK = "—";

function renderStats(s) {
  for (const p of [0, 1]) {
    const stat = s.stats[p];
    $(`stat-cards-${p}`).textContent = stat.cards;
    $(`stat-spades-${p}`).textContent = stat.spades;
    $(`stat-aces-${p}`).textContent = stat.aces;
    $(`stat-big-${p}`).textContent = stat.big_cassino ? CHECK_MARK : NO_MARK;
    $(`stat-little-${p}`).textContent = stat.little_cassino ? CHECK_MARK : NO_MARK;
    $(`stat-sweeps-${p}`).textContent = stat.sweeps;
    $(`stat-points-${p}`).textContent = s.score[p];
  }
}

function render() {
  applyStaticTranslations();

  const s = state.server;
  if (!s) return;

  $("score-you").textContent = s.score[0];
  $("score-computer").textContent = s.score[1];
  $("score-status").textContent = s.deal_over ? t("scoreFinal") : t("scoreLive");
  renderStats(s);

  $("computer-count").textContent = t("cardsCount", s.hands[1].length);
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
    status.innerHTML = t("dealOver");
  } else if (s.player !== 0) {
    status.innerHTML = t("computerThinking");
  } else if (state.selectedHand.size === 0) {
    status.innerHTML = t("yourTurnPick");
  } else if (!match) {
    status.innerHTML = t("notLegal");
  } else if (match.table.length === 0) {
    status.innerHTML = t("readyToPlace");
  } else {
    status.innerHTML = t("readyToCapture", match.table);
  }

  if (s.deal_over) {
    showOverlay(s.score);
  }
}

function showOverlay(scoreValue) {
  const overlay = $("overlay");
  overlay.classList.remove("hidden");
  let title;
  if (scoreValue[0] > scoreValue[1]) title = t("youWin");
  else if (scoreValue[1] > scoreValue[0]) title = t("computerWins");
  else title = t("tie");
  $("overlay-title").textContent = title;
  $("overlay-detail").textContent = t("scoreDetail", scoreValue[0], scoreValue[1]);
}

function hideOverlay() {
  $("overlay").classList.add("hidden");
}

function renderRules() {
  $("rules-content").innerHTML = t("rulesHtml");
}

// --- networking ---------------------------------------------------------

async function fetchState() {
  const res = await fetch("/api/state");
  state.server = await res.json();
  render();
}

async function newGame() {
  hideOverlay();
  state.logEntries = [];
  state.selectedHand.clear();
  state.selectedTable.clear();
  const res = await fetch("/api/new_game", { method: "POST" });
  state.server = await res.json();
  logPlain("newDealLog");
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
    state.logEntries.push({ key: "error", args: [err.error] });
    renderLog();
    return;
  }
  const data = await res.json();
  logMove("you", humanMove);
  for (const move of data.computer_moves || []) {
    logMove("computer", move);
  }
  state.server = data;
  render();
}

// --- wiring ---------------------------------------------------------------

$("new-game").addEventListener("click", newGame);
$("overlay-new-game").addEventListener("click", newGame);
$("clear-selection").addEventListener("click", () => {
  state.selectedHand.clear();
  state.selectedTable.clear();
  render();
});
$("play-move").addEventListener("click", playMove);

$("open-rules").addEventListener("click", () => {
  renderRules();
  $("rules-modal").classList.remove("hidden");
});
$("rules-close").addEventListener("click", () => {
  $("rules-modal").classList.add("hidden");
});
$("rules-modal").addEventListener("click", (event) => {
  if (event.target.id === "rules-modal") $("rules-modal").classList.add("hidden");
});

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.lang = btn.dataset.lang;
    saveLang(state.lang);
    render();
    renderLog();
    if (!$("rules-modal").classList.contains("hidden")) renderRules();
  });
});

applyStaticTranslations();
fetchState();
