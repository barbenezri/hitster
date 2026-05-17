"use client";

import { useRouter } from "next/navigation";
import { useGameSocket } from "@/hooks/useGameSocket";
import Lobby from "./Lobby";
import GameBoard from "./GameBoard";
import GameOver from "./GameOver";

export default function RoomView({ code }: { code: string }) {
  const router = useRouter();
  const { state, error, audioCue, myId, actions } = useGameSocket(code);

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        {error ? (
          <>
            <p className="text-accent">{error}</p>
            <button onClick={() => router.push("/")} className="bg-accent text-white rounded-xl px-5 py-3 font-bold">
              Back to start
            </button>
          </>
        ) : (
          <p className="text-muted">Connecting to room {code}…</p>
        )}
      </div>
    );
  }

  if (!myId || !state.players.some((p) => p.id === myId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted text-center">
          You don&apos;t have a seat in room <span className="font-bold text-white">{code}</span>.
        </p>
        <button onClick={() => router.push("/")} className="bg-accent text-white rounded-xl px-5 py-3 font-bold">
          Go back & join
        </button>
      </div>
    );
  }

  if (state.gameStatus === "waiting") {
    return <Lobby state={state} myId={myId} onStart={() => actions.start(code)} />;
  }

  if (state.gameStatus === "finished") {
    return <GameOver state={state} myId={myId} onBackHome={() => router.push("/")} />;
  }

  return (
    <GameBoard
      state={state}
      myId={myId}
      audioCue={audioCue}
      onPlace={(idx) => actions.place(code, idx)}
      onNext={() => actions.next(code)}
    />
  );
}
