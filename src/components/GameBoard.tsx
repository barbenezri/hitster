"use client";

import { useMemo, useState } from "react";
import type { PublicGameState } from "@/lib/types";
import Timeline from "./Timeline";
import AudioPlayer from "./AudioPlayer";
import MusicCard from "./MusicCard";
import type { AudioCue } from "@/hooks/useGameSocket";

export default function GameBoard({
  state,
  myId,
  audioCue,
  onPlace,
  onNext
}: {
  state: PublicGameState;
  myId: string;
  audioCue: AudioCue | null;
  onPlace: (index: number) => void;
  onNext: () => void;
}) {
  const me = useMemo(() => state.players.find((p) => p.id === myId), [state, myId]);
  const active = useMemo(
    () => state.players.find((p) => p.id === state.currentTurn) || null,
    [state]
  );
  const isMyTurn = state.currentTurn === myId;
  const [shakeKey, setShakeKey] = useState(0);

  // Trigger shake on incorrect reveal
  const lastIncorrect =
    state.lastResult && !state.lastResult.correct && state.lastResult.playerId === myId;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-center justify-between text-xs">
        <span className="text-muted">
          Room <span className="text-white font-bold tracking-widest">{state.code}</span>
        </span>
        <span className="text-muted">Round {state.round}</span>
      </header>

      <div className="bg-surface rounded-2xl p-3">
        <div className="flex gap-2 overflow-x-auto timeline-scroll">
          {state.players.map((p) => (
            <div
              key={p.id}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs flex items-center gap-2 ${
                p.id === state.currentTurn
                  ? "bg-accent text-white"
                  : "bg-bg text-muted"
              }`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  p.connected ? "bg-accent2" : "bg-muted"
                }`}
              />
              <span className="font-medium">{p.name}</span>
              <span className="opacity-70">{p.scored}/10</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        {state.turnPhase === "listening" && (
          <p className="text-sm text-muted">
            {isMyTurn ? (
              <>Your turn — drop the card into your timeline.</>
            ) : (
              <>Listening… <span className="text-white font-bold">{active?.name}</span> is placing.</>
            )}
          </p>
        )}
        {state.turnPhase === "revealed" && state.lastResult && (
          <p className={`text-sm ${state.lastResult.correct ? "text-accent2" : "text-accent"}`}>
            {state.lastResult.correct ? "Correct!" : "Wrong!"} It was {state.lastResult.track.releaseYear}.
          </p>
        )}
      </div>

      {state.turnPhase === "revealed" && state.lastResult && (
        <div
          key={shakeKey}
          className={`flex justify-center ${lastIncorrect ? "animate-shake" : "animate-pop"}`}
        >
          <MusicCard
            faceUp
            track={state.lastResult.track}
            highlight={state.lastResult.correct ? "good" : "bad"}
          />
        </div>
      )}

      {state.turnPhase === "listening" && state.currentTrack && (
        <div className="flex justify-center">
          <MusicCard faceUp={false} />
        </div>
      )}

      <AudioPlayer cue={audioCue} active={state.turnPhase === "listening"} />

      {me && (
        <Timeline
          timeline={me.timeline}
          insertEnabled={isMyTurn && state.turnPhase === "listening"}
          onInsert={(idx) => {
            setShakeKey((k) => k + 1);
            onPlace(idx);
          }}
          highlightTitle="Your timeline"
        />
      )}

      {state.turnPhase === "revealed" && (isMyTurn || me?.isHost) && (
        <button
          onClick={onNext}
          className="bg-accent text-white font-bold rounded-xl py-3 active:scale-95 transition"
        >
          {isMyTurn ? "Next player →" : "Advance turn (host)"}
        </button>
      )}

      {!isMyTurn && active && (
        <details className="bg-surface rounded-xl p-3 text-xs">
          <summary className="text-muted">
            View {active.name}&apos;s timeline ({active.scored}/10)
          </summary>
          <div className="mt-3">
            <Timeline
              timeline={active.timeline}
              insertEnabled={false}
              onInsert={() => {}}
              compact
            />
          </div>
        </details>
      )}
    </div>
  );
}
