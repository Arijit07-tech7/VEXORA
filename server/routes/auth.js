import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../database/db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    active: Boolean(user.active)
  };
}

router.post("/login", (req, res) => {
  const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!id || !password) {
    return res.status(400).json({ message: "User ID and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ? COLLATE NOCASE").get(id);
  if (!user || !user.active || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/logout", requireAuth, (_req, res) => {
  res.json({ ok: true, message: "Logged out" });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.userRecord) });
});

export default router;
