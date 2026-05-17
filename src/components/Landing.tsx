"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGameSocket } from "@/hooks/useGameSocket";
import { normalizeRoomCode } from "@/lib/room-code";

export default function Landing() {
  const router = useRouter();
  const { actions, error } = useGameSocket(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  async function onHost() {
    if (!name.trim()) return setLocalErr("Enter a nickname first");
    setBusy(true);
    setLocalErr(null);
    try {
      const { code: c } = await actions.create(name.trim());
      router.push(`/room/${c}`);
    } catch (e: any) {
      setLocalErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    const c = normalizeRoomCode(code);
    if (!name.trim()) return setLocalErr("Enter a nickname first");
    if (c.length !== 4) return setLocalErr("Room code is 4 characters");
    setBusy(true);
    setLocalErr(null);
    try {
      const { code: jc } = await actions.join(c, name.trim());
      router.push(`/room/${jc}`);
    } catch (e: any) {
      setLocalErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-10">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight">
          <span className="text-accent">HIT</span>STER
        </h1>
        <p className="text-muted mt-1 text-sm">Guess the year. Build the timeline.</p>
      </div>

      <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3">
        <label className="text-xs text-muted uppercase tracking-wider">Nickname</label>
        <input
          className="bg-bg rounded-xl px-3 py-3 outline-none border border-white/5 focus:border-accent"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          placeholder="DJ Bar"
          autoCorrect="off"
          autoCapitalize="words"
        />
      </div>

      <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3">
        <label className="text-xs text-muted uppercase tracking-wider">Join an existing room</label>
        <input
          className="bg-bg rounded-xl px-3 py-3 outline-none border border-white/5 focus:border-accent uppercase tracking-[0.4em] text-center text-lg"
          value={code}
          onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          placeholder="ABCD"
          maxLength={4}
          inputMode="text"
          autoCorrect="off"
          autoCapitalize="characters"
        />
        <button
          disabled={busy}
          onClick={onJoin}
          className="bg-accent2 text-bg font-bold rounded-xl py-3 active:scale-95 transition disabled:opacity-60"
        >
          Join Game
        </button>
      </div>

      <div className="text-center text-muted text-xs">— or —</div>

      <button
        disabled={busy}
        onClick={onHost}
        className="bg-accent text-white font-bold rounded-2xl py-4 text-lg active:scale-95 transition disabled:opacity-60"
      >
        Host a New Game
      </button>

      {(localErr || error) && (
        <p className="text-accent text-center text-sm">{localErr || error}</p>
      )}
    </div>
  );
}
