import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";



import marketRoutes from "./src/routes/market.js";  

import authRoutes from "./src/routes/auth.js";
import agentsRoutes from "./src/routes/agents.js";
import { createWSServer } from "./src/ws/server.js";
import chatRoutes from "./src/routes/chat.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/market", marketRoutes);

// ⭐ ADD THIS
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// REST (optional)
app.use("/auth", authRoutes);
app.use("/agents", agentsRoutes);
app.use("/chat", chatRoutes);
// WS SERVER
const httpServer = http.createServer(app);
createWSServer(httpServer);

httpServer.listen(5000, () => {
  console.log("HTTP + WS Server running at http://localhost:5000");
});