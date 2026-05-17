"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { getSocket, getSessionId } from "@/lib/socket-client";
import type { PublicGameState } from "@/lib/types";

export type AudioCue = { previewUrl: string; startAt: number };

type Ack = { ok: true; code: string; playerId: string } | { ok: false; error: string };

const PID_KEY = (code: string) => `hitster_pid_${code}`;

export function rememberPlayer(code: string, playerId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PID_KEY(code), playerId);
}
export function getMyId(code: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PID_KEY(code));
}

export function useGameSocket(code: string | null) {
  const [state, setState] = useState<PublicGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioCue, setAudioCue] = useState<AudioCue | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    const socket = getSocket();
    socketRef.current = socket;

    const onState = (s: PublicGameState) => setState(s);
    const onErr = (p: { message: string }) => setError(p.message);
    const onAudio = (cue: AudioCue) => setAudioCue(cue);

    socket.on("state:update", onState);
    socket.on("error:notify", onErr);
    socket.on("audio:play", onAudio);

    if (code) {
      const cached = getMyId(code);
      if (cached) setMyId(cached);
      socket.emit(
        "lobby:rejoin",
        { code, sessionId: sessionIdRef.current },
        (res: Ack) => {
          if (res.ok) {
            rememberPlayer(code, res.playerId);
            setMyId(res.playerId);
          } else {
            setError(res.error);
          }
        }
      );
    }

    return () => {
      socket.off("state:update", onState);
      socket.off("error:notify", onErr);
      socket.off("audio:play", onAudio);
    };
  }, [code]);

  const create = useCallback(
    (name: string): Promise<{ code: string; playerId: string }> =>
      new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "lobby:create",
          { name, sessionId: sessionIdRef.current },
          (res: Ack) => {
            if (res.ok) {
              rememberPlayer(res.code, res.playerId);
              setMyId(res.playerId);
              resolve({ code: res.code, playerId: res.playerId });
            } else reject(new Error(res.error));
          }
        );
      }),
    []
  );

  const join = useCallback(
    (code: string, name: string): Promise<{ code: string; playerId: string }> =>
      new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "lobby:join",
          { code, name, sessionId: sessionIdRef.current },
          (res: Ack) => {
            if (res.ok) {
              rememberPlayer(res.code, res.playerId);
              setMyId(res.playerId);
              resolve({ code: res.code, playerId: res.playerId });
            } else reject(new Error(res.error));
          }
        );
      }),
    []
  );

  const start = useCallback((code: string) => {
    socketRef.current?.emit("game:start", { code, sessionId: sessionIdRef.current });
  }, []);
  const place = useCallback((code: string, index: number) => {
    socketRef.current?.emit("game:place", { code, sessionId: sessionIdRef.current, index });
  }, []);
  const next = useCallback((code: string) => {
    socketRef.current?.emit("game:next", { code, sessionId: sessionIdRef.current });
  }, []);

  return {
    state,
    error,
    audioCue,
    myId,
    sessionId: sessionIdRef.current,
    actions: { create, join, start, place, next }
  };
}
