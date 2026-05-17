"use client";

import type { PublicGameState } from "@/lib/types";

export default function GameOver({
  state,
  myId,
  onBackHome
}: {
  state: PublicGameState;
  myId: string;
  onBackHome: () => void;
}) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  const youWon = state.winnerId === myId;
  const ranked = [...state.players].sort((a, b) => b.scored - a.scored);

  return (
    <div className="flex flex-col gap-6 pt-10">
      <div className="text-center">
        <h1 className="text-3xl font-black">
          {youWon ? "🏆 You won!" : `${winner?.name || "?"} wins!`}
        </h1>
        <p className="text-muted text-sm mt-2">First to 10 cards on the timeline.</p>
      </div>

      <div className="bg-surface rounded-2xl p-4">
        <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Final standings</h2>
        <ul className="flex flex-col gap-2">
          {ranked.map((p, i) => (
            <li key={p.id} className="flex justify-between items-center bg-bg rounded-xl px-3 py-2">
              <span>
                <span className="text-muted mr-2">#{i + 1}</span>
                <span className="font-medium">{p.name}</span>
                {p.id === myId && <span className="text-xs text-muted ml-1">(you)</span>}
              </span>
              <span className="text-sm">{p.scored} cards</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onBackHome}
        className="bg-accent text-white font-bold rounded-2xl py-4 text-lg active:scale-95 transition"
      >
        Back to start
      </button>
    </div>
  );
}
