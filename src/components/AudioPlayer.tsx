"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioCue } from "@/hooks/useGameSocket";

export default function AudioPlayer({ cue, active }: { cue: AudioCue | null; active: boolean }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!active) {
      ref.current?.pause();
      setPlaying(false);
      return;
    }
    if (!cue) return;
    const el = ref.current;
    if (!el) return;
    if (el.src !== cue.previewUrl) el.src = cue.previewUrl;
    el.currentTime = 0;

    const fire = async () => {
      try {
        await el.play();
        setPlaying(true);
        setNeedsTap(false);
      } catch {
        setNeedsTap(true);
      }
    };

    const delay = cue.startAt - Date.now();
    if (delay > 0) {
      const t = setTimeout(fire, delay);
      return () => clearTimeout(t);
    } else {
      fire();
    }
  }, [cue, active]);

  return (
    <div className="flex items-center justify-center gap-2">
      <audio ref={ref} preload="auto" playsInline />
      {needsTap && (
        <button
          onClick={() => ref.current?.play().then(() => { setPlaying(true); setNeedsTap(false); }).catch(() => {})}
          className="bg-accent2 text-bg font-bold rounded-full px-4 py-2 text-sm"
        >
          Tap to enable audio
        </button>
      )}
      {playing && active && (
        <span className="text-xs text-muted">▶ Playing snippet…</span>
      )}
    </div>
  );
}
