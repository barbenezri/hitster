import type { Server as IOServer, Socket } from "socket.io";
import { newRoom, getRoom } from "./rooms";
import {
  Room,
  addOrRejoinPlayer,
  beginTurn,
  markDisconnected,
  nextTurn,
  placeCard,
  publicState,
  startGame
} from "./game";
import { buildDeck } from "./deck";
import { normalizeRoomCode } from "../lib/room-code";

const AUDIO_START_GRACE_MS = 600;

function broadcastState(io: IOServer, room: Room) {
  io.to(room.code).emit("state:update", publicState(room));
}

function broadcastAudio(io: IOServer, room: Room) {
  if (!room.currentTrack) return;
  io.to(room.code).emit("audio:play", {
    previewUrl: room.currentTrack.previewUrl,
    startAt: Date.now() + AUDIO_START_GRACE_MS
  });
}

export function attachSocketHandlers(io: IOServer): void {
  io.on("connection", (socket: Socket) => {
    let attachedSession: string | null = null;
    let attachedRoomCode: string | null = null;

    socket.on(
      "lobby:create",
      (
        payload: { name: string; sessionId: string },
        cb: (res: { ok: true; code: string; playerId: string } | { ok: false; error: string }) => void
      ) => {
        const { name, sessionId } = payload || ({} as any);
        if (!name?.trim() || !sessionId) {
          return cb({ ok: false, error: "Missing name or session" });
        }
        const room = newRoom(sessionId);
        const result = addOrRejoinPlayer(room, sessionId, name);
        if ("error" in result) return cb({ ok: false, error: result.error });
        socket.join(room.code);
        room.socketToSession.set(socket.id, sessionId);
        attachedSession = sessionId;
        attachedRoomCode = room.code;
        cb({ ok: true, code: room.code, playerId: result.player.id });
        broadcastState(io, room);
      }
    );

    socket.on(
      "lobby:join",
      (
        payload: { code: string; name: string; sessionId: string },
        cb: (res: { ok: true; code: string; playerId: string } | { ok: false; error: string }) => void
      ) => {
        const { code, name, sessionId } = payload || ({} as any);
        const room = getRoom(code);
        if (!room) return cb({ ok: false, error: "Room not found" });
        const result = addOrRejoinPlayer(room, sessionId, name);
        if ("error" in result) return cb({ ok: false, error: result.error });
        socket.join(room.code);
        room.socketToSession.set(socket.id, sessionId);
        attachedSession = sessionId;
        attachedRoomCode = room.code;
        cb({ ok: true, code: room.code, playerId: result.player.id });
        broadcastState(io, room);
      }
    );

    socket.on(
      "lobby:rejoin",
      (
        payload: { code: string; sessionId: string },
        cb: (res: { ok: true; code: string; playerId: string } | { ok: false; error: string }) => void
      ) => {
        const { code, sessionId } = payload || ({} as any);
        const room = getRoom(code);
        if (!room) return cb({ ok: false, error: "Room not found" });
        const existing = room.sessionToPlayerId.get(sessionId);
        if (!existing) return cb({ ok: false, error: "No seat for this session" });
        const player = room.players.find((p) => p.id === existing);
        if (player) player.connected = true;
        socket.join(room.code);
        room.socketToSession.set(socket.id, sessionId);
        attachedSession = sessionId;
        attachedRoomCode = room.code;
        cb({ ok: true, code: room.code, playerId: existing });
        broadcastState(io, room);
        // If a turn is in progress and audio still playing, resend the start cue.
        if (room.gameStatus === "active" && room.turnPhase === "listening") {
          socket.emit("audio:play", {
            previewUrl: room.currentTrack!.previewUrl,
            startAt: Date.now() + AUDIO_START_GRACE_MS
          });
        }
      }
    );

    socket.on(
      "game:start",
      async (payload: { code: string; sessionId: string }) => {
        const room = getRoom(payload.code);
        if (!room) return;
        try {
          const deck = await buildDeck();
          const result = startGame(room, deck, payload.sessionId);
          if (!result.ok) {
            socket.emit("error:notify", { message: result.error });
            return;
          }
          broadcastState(io, room);
          broadcastAudio(io, room);
        } catch (err) {
          socket.emit("error:notify", { message: "Failed to build deck" });
        }
      }
    );

    socket.on(
      "game:place",
      (payload: { code: string; sessionId: string; index: number }) => {
        const room = getRoom(payload.code);
        if (!room) return;
        const result = placeCard(room, payload.sessionId, payload.index);
        if (!result.ok) {
          socket.emit("error:notify", { message: result.error });
          return;
        }
        broadcastState(io, room);
      }
    );

    socket.on(
      "game:next",
      (payload: { code: string; sessionId: string }) => {
        const room = getRoom(payload.code);
        if (!room) return;
        if (room.gameStatus === "finished") {
          broadcastState(io, room);
          return;
        }
        const result = nextTurn(room, payload.sessionId);
        if (!result.ok) {
          socket.emit("error:notify", { message: result.error });
          return;
        }
        broadcastState(io, room);
        broadcastAudio(io, room);
      }
    );

    socket.on("disconnect", () => {
      if (!attachedRoomCode || !attachedSession) return;
      const room = getRoom(attachedRoomCode);
      if (!room) return;
      room.socketToSession.delete(socket.id);
      // Only mark disconnected if no other socket from same session is still connected.
      const stillHere = Array.from(room.socketToSession.values()).includes(attachedSession);
      if (!stillHere) {
        markDisconnected(room, attachedSession);
        broadcastState(io, room);
      }
    });
  });
}
