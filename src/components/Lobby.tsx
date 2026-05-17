"use client";

import type { PublicGameState } from "@/lib/types";

export default function Lobby({
  state,
  myId,
  onStart
}: {
  state: PublicGameState;
  myId: string;
  onStart: () => void;
}) {
  const isHost = state.players.find((p) => p.id === myId)?.isHost;
  const enoughPlayers = state.players.length >= 2;

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="text-center">
        <p className="text-muted text-xs uppercase tracking-widest">Room Code</p>
        <p className="text-5xl font-black tracking-[0.4em] mt-1">{state.code}</p>
        <p className="text-muted text-sm mt-2">Share this code with friends.</p>
      </div>

      <div className="bg-surface rounded-2xl p-4">
        <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
          Players ({state.players.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between bg-bg rounded-xl px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    p.connected ? "bg-accent2" : "bg-muted"
                  }`}
                />
                <span className="font-medium">{p.name}</span>
                {p.id === myId && <span className="text-xs text-muted">(you)</span>}
              </span>
              {p.isHost && (
                <span className="text-[10px] uppercase tracking-wider text-accent">Host</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <button
          disabled={!enoughPlayers}
          onClick={onStart}
          className="bg-accent text-white font-bold rounded-2xl py-4 text-lg active:scale-95 transition disabled:opacity-50"
        >
          {enoughPlayers ? "Start Game" : "Waiting for more players…"}
        </button>
      ) : (
        <p className="text-center text-muted text-sm">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}
