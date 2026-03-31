import "dotenv/config";
import cors from "cors";
import express from "express";
import logRoutes from "./routes/logRoutes.js";

const app = express();
const port = Number(process.env.SERVER_PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/logs", logRoutes);

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

app.listen(port, () => {
  console.log(`Express Log API running on port ${port}`);
});
