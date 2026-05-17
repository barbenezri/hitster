"use client";

import type { Track } from "@/lib/types";

export default function MusicCard({
  faceUp,
  track,
  compact,
  highlight
}: {
  faceUp: boolean;
  track?: Track;
  compact?: boolean;
  highlight?: "good" | "bad";
}) {
  const size = compact ? "w-24 h-32" : "w-32 h-44";
  const ring =
    highlight === "good"
      ? "ring-2 ring-accent2"
      : highlight === "bad"
      ? "ring-2 ring-accent"
      : "ring-1 ring-white/10";

  if (!faceUp || !track) {
    return (
      <div
        className={`shrink-0 ${size} ${ring} rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center gap-2 relative overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:8px_8px]" />
        <Equalizer />
        <span className="text-[10px] uppercase tracking-widest text-muted">Hitster</span>
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 ${size} ${ring} rounded-2xl bg-surface flex flex-col overflow-hidden relative`}
    >
      <div className="flex-1 bg-zinc-900 relative">
        {track.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.albumArt}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-accent2/40" />
        )}
      </div>
      <div className="p-1.5 text-center bg-black/60">
        <p className={`font-black ${compact ? "text-lg" : "text-2xl"} leading-none`}>
          {track.releaseYear}
        </p>
        <p className="text-[10px] truncate leading-tight">{track.title}</p>
        <p className="text-[9px] text-muted truncate">{track.artist}</p>
      </div>
    </div>
  );
}

function Equalizer() {
  return (
    <div className="flex items-end gap-1 h-10">
      {[0, 0.15, 0.3, 0.45, 0.6].map((d, i) => (
        <span
          key={i}
          className="block w-1.5 h-full bg-accent2 rounded-full origin-bottom animate-eq"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </div>
  );
}
