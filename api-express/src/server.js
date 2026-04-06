import "dotenv/config";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import { config } from "./lib/config.js";
import { dispatchPendingEvents } from "./lib/outbox.js";

const app = express();

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use((request, response, next) => {
  const requestId = request.header("x-request-id") || randomUUID();
  request.requestId = requestId;
  response.setHeader("X-Request-Id", requestId);
  next();
});

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api", authRoutes);
app.use("/api/todos", todoRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: "Internal server error"
  });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

async function bootstrap() {
  await dispatchPendingEvents();

  app.listen(config.port, () => {
    console.log(`Express Task API running on port ${config.port}`);
  });
}

bootstrap().catch(error => {
  console.error("Failed to bootstrap Express Task API", error);
  process.exit(1);
});
