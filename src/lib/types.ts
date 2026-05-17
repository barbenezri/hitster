export type Track = {
  id: string;
  title: string;
  artist: string;
  releaseYear: number;
  previewUrl: string;
  albumArt?: string;
};

export type Player = {
  id: string;
  name: string;
  tokens: number;
  timeline: Track[];
  connected: boolean;
  isHost: boolean;
};

export type GameStatus = "waiting" | "active" | "finished";
export type TurnPhase = "idle" | "listening" | "revealed";

export type PublicTrack =
  | { hidden: true; previewUrl: string }
  | ({ hidden: false } & Track);

export type PublicPlayer = Omit<Player, "timeline"> & {
  timeline: Track[];
  scored: number;
};

export type PublicGameState = {
  code: string;
  hostId: string;
  players: PublicPlayer[];
  currentTurn: string | null;
  gameStatus: GameStatus;
  turnPhase: TurnPhase;
  currentTrack: PublicTrack | null;
  deckRemaining: number;
  round: number;
  winnerId: string | null;
  lastResult?: {
    playerId: string;
    correct: boolean;
    track: Track;
  } | null;
};

export const WIN_TARGET = 10;
export const STARTING_TOKENS = 2;
export const MAX_TOKENS = 5;

export type LobbyAck =
  | { ok: true; code: string; playerId: string }
  | { ok: false; error: string };

export type ClientToServer = {
  "lobby:create": (
    payload: { name: string; sessionId: string },
    cb: (res: LobbyAck) => void
  ) => void;
  "lobby:join": (
    payload: { code: string; name: string; sessionId: string },
    cb: (res: LobbyAck) => void
  ) => void;
  "lobby:rejoin": (
    payload: { code: string; sessionId: string },
    cb: (res: LobbyAck) => void
  ) => void;
  "game:start": (payload: { code: string; sessionId: string }) => void;
  "game:place": (payload: { code: string; sessionId: string; index: number }) => void;
  "game:next": (payload: { code: string; sessionId: string }) => void;
};

export type ServerToClient = {
  "state:update": (state: PublicGameState) => void;
  "audio:play": (payload: { previewUrl: string; startAt: number }) => void;
  "error:notify": (payload: { message: string }) => void;
};
