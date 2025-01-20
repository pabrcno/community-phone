import http from "http";
import { callsHandler, env } from "./injector.ts";
import { logger } from "./core/index.ts";

const server = http.createServer(async (req, res) => {
  if (req.url === "/events" && req.method === "POST") {
    await callsHandler.handleEvent(req, res);
    return;
  }

  if (req.url === "/metrics" && req.method === "GET") {
    await callsHandler.handleMetrics(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(env.PORT, () => {
  logger.logInfo(`Server is running on port ${env.PORT}`);
});
