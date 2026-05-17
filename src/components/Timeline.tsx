"use client";

import type { Track } from "@/lib/types";
import MusicCard from "./MusicCard";

export default function Timeline({
  timeline,
  insertEnabled,
  onInsert,
  highlightTitle,
  compact
}: {
  timeline: Track[];
  insertEnabled: boolean;
  onInsert: (index: number) => void;
  highlightTitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {highlightTitle && (
        <h2 className="text-xs uppercase tracking-wider text-muted">{highlightTitle}</h2>
      )}
      <div className="timeline-scroll overflow-x-auto -mx-4 px-4">
        <div className="flex items-stretch gap-2 min-w-max py-1">
          <InsertSlot enabled={insertEnabled} onClick={() => onInsert(0)} />
          {timeline.map((t, i) => (
            <div key={t.id} className="flex items-stretch gap-2">
              <MusicCard faceUp track={t} compact={compact} />
              <InsertSlot
                enabled={insertEnabled}
                onClick={() => onInsert(i + 1)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsertSlot({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={!enabled}
      onClick={onClick}
      aria-label="Place card here"
      className={`shrink-0 w-10 rounded-xl flex items-center justify-center text-2xl font-bold transition ${
        enabled
          ? "bg-accent/20 text-accent border-2 border-dashed border-accent active:bg-accent active:text-white"
          : "bg-transparent text-transparent border-2 border-dashed border-white/5"
      }`}
    >
      +
    </button>
  );
}
