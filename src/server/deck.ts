import { readFileSync } from "fs";
import { resolve } from "path";
import { Track } from "../lib/types";
import { findPreview } from "../lib/deezer";

type SeedTrack = { title: string; artist: string; releaseYear: number };

let cachedSeed: SeedTrack[] | null = null;
let cachedDeck: Track[] | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function loadSeed(): SeedTrack[] {
  if (cachedSeed) return cachedSeed;
  const p = resolve(process.cwd(), "data", "seed-tracks.json");
  cachedSeed = JSON.parse(readFileSync(p, "utf8")) as SeedTrack[];
  return cachedSeed;
}

async function pMapLimited<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const my = idx++;
      if (my >= items.length) return;
      results[my] = await fn(items[my]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export async function buildDeck(): Promise<Track[]> {
  if (cachedDeck && Date.now() - cacheBuiltAt < CACHE_TTL_MS) {
    return shuffle(cachedDeck);
  }
  const seed = loadSeed();
  const enriched = await pMapLimited(seed, 8, async (s) => {
    const hit = await findPreview(s.title, s.artist);
    if (!hit) return null;
    const t: Track = {
      id: `dz_${hit.deezerId}`,
      title: s.title,
      artist: s.artist,
      releaseYear: s.releaseYear,
      previewUrl: hit.previewUrl,
      albumArt: hit.albumArt
    };
    return t;
  });
  const valid = enriched.filter((t): t is Track => t !== null);
  cachedDeck = valid;
  cacheBuiltAt = Date.now();
  return shuffle(valid);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
