"use client";

import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (_socket) return _socket;
  _socket = io({
    autoConnect: true,
    transports: ["websocket", "polling"]
  });
  return _socket;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "hitster_session";
  let s = localStorage.getItem(KEY);
  if (!s) {
    s = `s_${randomId(12)}`;
    localStorage.setItem(KEY, s);
  }
  return s;
}

function randomId(len: number): string {
  // crypto.randomUUID requires a secure context (HTTPS or localhost), which is
  // not the case when serving the dev build to phones over LAN HTTP. Use a
  // non-crypto fallback — collision risk is fine for a session id.
  const c: any = typeof window !== "undefined" ? (window as any).crypto : undefined;
  if (c?.getRandomValues) {
    const buf = new Uint8Array(Math.ceil(len / 2));
    c.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, len);
  }
  let s = "";
  while (s.length < len) s += Math.random().toString(36).slice(2);
  return s.slice(0, len);
}
