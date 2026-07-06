import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { createSocketServer } from "./socket.js";

const app = Fastify({ logger: true });

const INTERNAL_SECRET = process.env.INTERNAL_GATEWAY_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!INTERNAL_SECRET) {
  throw new Error("INTERNAL_GATEWAY_SECRET no está en las variables de entorno");
}

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL no está en las variables de entorno");
}

await app.register(cors, { origin: FRONTEND_URL });

app.addHook("onRequest", async (request, reply) => {
  if (request.headers["x-internal-gateway"] !== INTERNAL_SECRET) {
    reply.code(403).send({ error: "Forbidden" });
  }
});

app.get("/health", async () => ({ status: "ok" }));

createSocketServer(app, INTERNAL_SECRET);

const PORT = 3001;
const HOST = "127.0.0.1";

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }

  app.log.info(
    `Backend Fastify escuchando en http://${HOST}:${PORT} — sin acceso directo, solo alcanzable a través de Nginx en http://localhost:8080`,
  );
  app.log.info(
    "Socket.IO inicializado en /socket.io/ — proxied por Nginx en http://localhost:8080/socket.io/",
  );
});
