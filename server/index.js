import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/auth.js";
import agentsRoute from "./src/routes/agents.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/agents", agentsRoute);

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    message: "NexusAI API is online 🚀",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});