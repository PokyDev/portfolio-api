import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer } from "socket.io";

export function createSocketServer(
  app: FastifyInstance,
  internalSecret: string,
): SocketIOServer {
  const io = new SocketIOServer(app.server, {
    path: "/socket.io/", // Tiene que coincidir con el location de nginx
    allowRequest: (req, callback) => {
      const ok = req.headers["x-internal-gateway"] === internalSecret;
      callback(null, ok); // false -> Rechaza el handshake (400)
    },
  });

  io.on("connection", (socket) => {
    app.log.info(`socket conectado: ${socket.id}`);
    socket.on("ping-test", () => socket.emit("pong-test", { ok: true }));
  });

  return io;
}
