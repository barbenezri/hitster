import {
  GameStatus,
  Player,
  PublicGameState,
  PublicPlayer,
  PublicTrack,
  Track,
  TurnPhase,
  WIN_TARGET,
  STARTING_TOKENS
} from "../lib/types";

export type Room = {
  code: string;
  hostSessionId: string;
  players: Player[];
  sessionToPlayerId: Map<string, string>;
  socketToSession: Map<string, string>;
  gameStatus: GameStatus;
  turnPhase: TurnPhase;
  deck: Track[];
  discard: Track[];
  currentTrack: Track | null;
  currentTurnIdx: number;
  round: number;
  winnerId: string | null;
  lastResult: PublicGameState["lastResult"];
  createdAt: number;
};

export function createRoom(code: string, hostSessionId: string): Room {
  return {
    code,
    hostSessionId,
    players: [],
    sessionToPlayerId: new Map(),
    socketToSession: new Map(),
    gameStatus: "waiting",
    turnPhase: "idle",
    deck: [],
    discard: [],
    currentTrack: null,
    currentTurnIdx: 0,
    round: 0,
    winnerId: null,
    lastResult: null,
    createdAt: Date.now()
  };
}

export function addOrRejoinPlayer(
  room: Room,
  sessionId: string,
  name: string
): { player: Player; isNew: boolean } | { error: string } {
  const existingId = room.sessionToPlayerId.get(sessionId);
  if (existingId) {
    const p = room.players.find((p) => p.id === existingId);
    if (p) {
      p.connected = true;
      if (name) p.name = name;
      return { player: p, isNew: false };
    }
  }
  if (room.gameStatus !== "waiting") {
    return { error: "Game already in progress" };
  }
  if (room.players.length >= 8) {
    return { error: "Room is full" };
  }
  if (!name.trim()) return { error: "Name required" };
  const playerId = `p_${Math.random().toString(36).slice(2, 10)}`;
  const player: Player = {
    id: playerId,
    name: name.trim().slice(0, 20),
    tokens: STARTING_TOKENS,
    timeline: [],
    connected: true,
    isHost: sessionId === room.hostSessionId
  };
  room.players.push(player);
  room.sessionToPlayerId.set(sessionId, playerId);
  return { player, isNew: true };
}

export function markDisconnected(room: Room, sessionId: string): void {
  const pid = room.sessionToPlayerId.get(sessionId);
  if (!pid) return;
  const p = room.players.find((p) => p.id === pid);
  if (p) p.connected = false;
}

export function startGame(room: Room, deck: Track[], hostSessionId: string): { ok: true } | { ok: false; error: string } {
  if (hostSessionId !== room.hostSessionId) return { ok: false, error: "Only host can start" };
  if (room.gameStatus !== "waiting") return { ok: false, error: "Already started" };
  if (room.players.length < 2) return { ok: false, error: "Need at least 2 players" };
  if (deck.length < room.players.length + 5) return { ok: false, error: "Deck too small" };

  // Deal one starter card to each player (visible)
  for (const p of room.players) {
    const starter = deck.shift()!;
    p.timeline = [starter];
  }
  room.deck = deck;
  room.gameStatus = "active";
  room.currentTurnIdx = 0;
  room.round = 1;
  beginTurn(room);
  return { ok: true };
}

export function beginTurn(room: Room): void {
  if (room.deck.length === 0) {
    // Deck exhausted; recycle discards
    if (room.discard.length === 0) {
      finish(room);
      return;
    }
    room.deck = shuffle(room.discard);
    room.discard = [];
  }
  room.currentTrack = room.deck.shift()!;
  room.turnPhase = "listening";
  room.lastResult = null;
}

export function placeCard(
  room: Room,
  sessionId: string,
  index: number
): { ok: true; correct: boolean; track: Track } | { ok: false; error: string } {
  if (room.gameStatus !== "active") return { ok: false, error: "Game not active" };
  if (room.turnPhase !== "listening") return { ok: false, error: "Not your moment" };
  const pid = room.sessionToPlayerId.get(sessionId);
  if (!pid) return { ok: false, error: "Not in room" };
  const player = room.players[room.currentTurnIdx];
  if (!player || player.id !== pid) return { ok: false, error: "Not your turn" };
  const track = room.currentTrack;
  if (!track) return { ok: false, error: "No active track" };

  const tl = player.timeline;
  if (index < 0 || index > tl.length) return { ok: false, error: "Bad index" };

  const left = index === 0 ? -Infinity : tl[index - 1].releaseYear;
  const right = index === tl.length ? Infinity : tl[index].releaseYear;
  const correct = left <= track.releaseYear && track.releaseYear <= right;

  if (correct) {
    tl.splice(index, 0, track);
    if (tl.length >= WIN_TARGET) {
      room.winnerId = player.id;
      room.turnPhase = "revealed";
      room.lastResult = { playerId: player.id, correct: true, track };
      finish(room);
      return { ok: true, correct, track };
    }
  } else {
    room.discard.push(track);
  }

  room.turnPhase = "revealed";
  room.lastResult = { playerId: player.id, correct, track };
  return { ok: true, correct, track };
}

export function nextTurn(room: Room, sessionId: string): { ok: true } | { ok: false; error: string } {
  if (room.gameStatus !== "active") return { ok: false, error: "Game not active" };
  if (room.turnPhase !== "revealed") return { ok: false, error: "Reveal not yet" };
  // Anyone can advance once revealed (auto-advance also OK). Restrict to the active player or host.
  const pid = room.sessionToPlayerId.get(sessionId);
  const current = room.players[room.currentTurnIdx];
  const isHost = sessionId === room.hostSessionId;
  if (pid !== current?.id && !isHost) return { ok: false, error: "Wait your turn" };

  room.currentTurnIdx = (room.currentTurnIdx + 1) % room.players.length;
  if (room.currentTurnIdx === 0) room.round += 1;
  room.currentTrack = null;
  beginTurn(room);
  return { ok: true };
}

function finish(room: Room): void {
  room.gameStatus = "finished";
  room.turnPhase = "idle";
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function publicState(room: Room): PublicGameState {
  const players: PublicPlayer[] = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    tokens: p.tokens,
    timeline: p.timeline,
    connected: p.connected,
    isHost: p.isHost,
    scored: p.timeline.length
  }));
  const current = room.players[room.currentTurnIdx];
  let currentTrack: PublicTrack | null = null;
  if (room.currentTrack) {
    if (room.turnPhase === "revealed") {
      currentTrack = { hidden: false, ...room.currentTrack };
    } else {
      currentTrack = { hidden: true, previewUrl: room.currentTrack.previewUrl };
    }
  }
  return {
    code: room.code,
    hostId: room.players.find((p) => p.isHost)?.id || "",
    players,
    currentTurn: current?.id || null,
    gameStatus: room.gameStatus,
    turnPhase: room.turnPhase,
    currentTrack,
    deckRemaining: room.deck.length,
    round: room.round,
    winnerId: room.winnerId,
    lastResult: room.lastResult
  };
}
