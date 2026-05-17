import { Room, createRoom } from "./game";
import { generateRoomCode, normalizeRoomCode } from "../lib/room-code";

const rooms = new Map<string, Room>();

export function newRoom(hostSessionId: string): Room {
  const code = generateRoomCode((c) => rooms.has(c));
  const room = createRoom(code, hostSessionId);
  rooms.set(code, room);
  return room;
}

export function getRoom(codeRaw: string): Room | undefined {
  return rooms.get(normalizeRoomCode(codeRaw));
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

// Janitor: drop empty/idle rooms after 2 hours
setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60 * 2;
  for (const [code, room] of rooms) {
    const allGone = room.players.every((p) => !p.connected);
    if (allGone && room.createdAt < cutoff) rooms.delete(code);
  }
}, 1000 * 60 * 15).unref?.();
