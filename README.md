# Hitster (digital, multiplayer)

Mobile-first, online multiplayer rebuild of the card game *Hitster*. Players join a lobby on their phones, listen to a synced 30-second snippet, and place the song at the correct chronological position in their personal timeline. First to 10 placed cards wins.

This drop is the **MVP**: lobby → join → synced audio → starter card → timeline placement → win. The token economy (skip / trade / shout HITSTER) and the DJ-mode TV view are deliberately deferred — see *Deferred features* below.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Custom Node server** (`server.ts`, run via `tsx`) hosting Next + Socket.io on the same port
- **Tailwind CSS**, mobile-first, max-width container, double-tap zoom disabled
- **Socket.io** for low-latency state broadcasts
- **Deezer Web API** for 30-second previews + album art (no auth, no user login)

### Why Deezer and not Spotify
Spotify removed `preview_url` from Web API responses for newly created apps in late November 2024, so the field comes back `null` for most or all tracks. Deezer's `/search` endpoint returns a reliable `preview` (mp3) URL and `album.cover_medium` for nearly every track, no API key required. The deck pipeline matches our curated seed playlist (`data/seed-tracks.json`) against Deezer at game start.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000 on multiple devices on the same LAN, or two browser tabs
```

To play from your phone against the laptop, find the LAN IP and visit `http://<LAN_IP>:3000` from each device. The server binds to `0.0.0.0` by default.

```bash
PORT=4000 HOSTNAME=0.0.0.0 npm run dev
```

## Deploy

The custom Socket.io server needs a long-lived Node process, so **Vercel's serverless model does not work for this app**. Use Railway, Fly.io, Render, or any VPS.

### Deploy to Railway (recommended)

Railway picks up `railway.json` and `package.json` automatically. Two paths:

**A. Via GitHub (easiest):**
1. Push this folder to a GitHub repo.
2. At [railway.com/new](https://railway.com/new) → **Deploy from GitHub repo** → pick the repo.
3. Railway runs `npm ci && npm run build` then `npm start`.
4. Once it's green, open the service → **Settings → Networking → Generate Domain**. You'll get a `https://*.up.railway.app` URL.
5. Open that URL on multiple phones. Done.

**B. Via Railway CLI (no GitHub needed):**
```bash
npm i -g @railway/cli
railway login
railway init           # name the project
railway up             # uploads + builds + deploys
railway domain         # generates a public HTTPS URL
```

No env vars are required for the MVP — Railway sets `PORT` automatically, and `server.ts` already reads it.

### Notes

- `tsx` is intentionally in `dependencies` (not `devDependencies`) so Railway's post-build prune doesn't strip it before `npm start` runs.
- The free tier covers a party game easily; only watch out for the monthly execution-hour limit on the trial plan.
- Rooms are still **in-memory and single-instance**. Don't scale the Railway service to >1 replica without first moving state into Redis + adding the Socket.io Redis adapter.

## Architecture

```
server.ts                       custom Node entry: Next + Socket.io
src/server/
  socket.ts                     all Socket.io event handlers
  rooms.ts                      in-memory room registry, room codes
  game.ts                       game state machine: turn, placement, win
  deck.ts                       Deezer-enriched deck builder (cached 1h)
src/lib/
  types.ts                      shared client/server types
  deezer.ts                     Deezer search wrapper
  fuzzy.ts                      fuzzy matcher (ready for the guess feature)
  room-code.ts                  4-char unambiguous room codes
  socket-client.ts              browser Socket.io singleton + sessionId
src/hooks/useGameSocket.ts      React hook: state, audio cue, actions
src/components/                 Landing, Lobby, GameBoard, Timeline,
                                MusicCard, AudioPlayer, GameOver
src/app/
  page.tsx                      /
  room/[code]/page.tsx          /room/ABCD
data/seed-tracks.json           curated historical hits (~80 songs)
```

### Game state model

The server owns all state. Every change is a `state:update` broadcast over the room channel. The wire shape (`PublicGameState`) hides the current track's title / artist / year while a turn is in the `listening` phase — only the preview URL is sent. On the `revealed` phase, the full track is broadcast.

Two-phase turn:
1. **listening** — server picks `deck.shift()` as the current track, emits `audio:play` with a `startAt` timestamp (~600 ms in the future) so all clients can start the snippet close to in-sync.
2. **revealed** — active player tapped an insertion slot, server validated, reveals the year and flags `lastResult.correct`. Active player (or host) taps "Next" to advance.

### Reconnect / refresh tolerance

Each client generates a `sessionId` once and stores it in `localStorage`. The server keeps `sessionId → playerId` so a refresh / brief disconnect rejoins the same seat. The `playerId` is stored per-room in `localStorage` (`hitster_pid_<code>`) so the client can identify itself in the public state.

### Audio sync

There is no per-frame sync — that would require WebRTC. Instead, the server broadcasts the start time and clients schedule playback. The 600 ms grace covers typical WAN jitter; tighter sync would need [NTP-style offset estimation](https://github.com/enmasseio/timesync).

### Host-only controls

Only the player whose `sessionId` matches `room.hostSessionId` can call `game:start`. The first player to enter a freshly-created room is the host.

## Deferred features (from the original spec)

These were intentionally left out of the MVP to get something playable end-to-end first. The scaffolding is already there for several of them:

- **Token economy** — `tokens` field exists on `Player` (initialized to 2). Need UI + handlers for:
  - **Skip** (cost 1): discard current, draw next, same player.
  - **Trade** (cost 3): place the card without year-checking.
  - **Earn**: artist + title guess UI; `src/lib/fuzzy.ts` already implements normalize + Levenshtein matching.
- **Shout HITSTER challenge window** — 5-second server-side timer between `place` event and reveal broadcast. Needs `turnPhase: "challengeable"` between `listening` and `revealed`, a per-room timer, and a `game:challenge` event with target index from the challenger.
- **DJ-mode spectator view** — a separate route (e.g. `/room/[code]/dj`) that subscribes to the same room state but renders a TV-friendly layout: big "now playing" panel, scoreboard, turn order. The same socket events power it; no server changes required.
- **Polish** — vinyl-record / cassette card art, sliding card animation into the timeline (the `animate-pop` and `animate-shake` keyframes exist; wire to a layout-aware transition like Framer Motion `layout`).

## Limits and known issues

- **Single-instance only**: the room registry lives in memory. Horizontally scaling requires moving rooms to Redis + Socket.io's Redis adapter.
- **Deezer matching is best-effort**: some seed-list songs may not match a Deezer track exactly. Those are silently dropped from the deck.
- **No persistence**: a server restart drops all rooms. Acceptable for a party game.
- **Audio sync is approximate**: ~50–300 ms of skew across devices on the same network is typical; on different networks expect up to ~1 s.
