const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// AUTH ROUTES (IMPORTANT)
const authRoutes = require("./src/routes/auth");
app.use("/auth", authRoutes);

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    message: "NexusAI API is online 🚀",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});