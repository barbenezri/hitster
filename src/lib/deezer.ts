type DeezerSearchResponse = {
  data?: Array<{
    id: number;
    title: string;
    title_short?: string;
    preview?: string;
    artist?: { name: string };
    album?: { cover_medium?: string; cover?: string };
  }>;
};

export type EnrichedHit = {
  previewUrl: string;
  albumArt?: string;
  deezerId: number;
};

export async function findPreview(title: string, artist: string): Promise<EnrichedHit | null> {
  const q = `track:"${escapeQuotes(title)}" artist:"${escapeQuotes(artist)}"`;
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as DeezerSearchResponse;
    const hit = (json.data || []).find((d) => !!d.preview);
    if (!hit || !hit.preview) return null;
    return {
      previewUrl: hit.preview,
      albumArt: hit.album?.cover_medium || hit.album?.cover,
      deezerId: hit.id
    };
  } catch {
    return null;
  }
}

function escapeQuotes(s: string): string {
  return s.replace(/"/g, "");
}
