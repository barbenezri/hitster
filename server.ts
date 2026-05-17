import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as IOServer } from "socket.io";
import { attachSocketHandlers } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsed = parse(req.url || "/", true);
    handle(req, res, parsed);
  });

  const io = new IOServer(httpServer, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"]
  });

  attachSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Hitster ready on http://${hostname}:${port}`);
  });
});
