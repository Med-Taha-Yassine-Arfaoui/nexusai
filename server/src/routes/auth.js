  // ESM imports
  import express from "express";
  import bcrypt from "bcryptjs";
  import jwt from "jsonwebtoken";
  import { PrismaClient } from "@prisma/client";

  const router = express.Router();
  const prisma = new PrismaClient();

  // REGISTER
  router.post("/register", async (req, res) => {
    try {
      const { email, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { email, password: hashed },
      });

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({ token, email: user.email });

    } catch (err) {
      console.error("REGISTER ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // LOGIN
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({ token, email: user.email });

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // CHANGE PASSWORD
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashed },
    });

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }

  router.post("/change-email", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "New email required" });

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { email },
    });

    res.json({ message: "Email updated", email });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});
});

  export default router;