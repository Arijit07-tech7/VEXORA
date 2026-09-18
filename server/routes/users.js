import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../database/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);

const safe = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email || "",
  role: u.role,
  active: Boolean(u.active),
  created_at: u.created_at
});

router.get("/", (req, res) => {
  const role = ["admin", "member"].includes(req.query.role) ? req.query.role : null;
  const users = role
    ? db.prepare("SELECT * FROM users WHERE role=? ORDER BY name, id").all(role)
    : db.prepare("SELECT * FROM users ORDER BY name, id").all();
  res.json({ users: users.map(safe) });
});

router.post("/", (req, res) => {
  const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = req.body?.role === "admin" ? "admin" : req.body?.role === "member" ? "member" : "";
  const active = req.body?.active !== false;

  if (!id || !name || !password || !role) {
    return res.status(400).json({ message: "ID, name, password and valid role are required" });
  }
  if (id.toUpperCase() === "ARIJIT") {
    return res.status(400).json({ message: "The primary admin ID is reserved" });
  }
  if (db.prepare("SELECT id FROM users WHERE id=? COLLATE NOCASE").get(id)) {
    return res.status(409).json({ message: "User ID already exists" });
  }

  const hash = bcrypt.hashSync(password, 12);
  db.prepare(`
    INSERT INTO users(id,name,email,password_hash,role,active)
    VALUES(?,?,?,?,?,?)
  `).run(id, name, email, hash, role, active ? 1 : 0);

  res.status(201).json({ user: safe(db.prepare("SELECT * FROM users WHERE id=?").get(id)) });
});

router.put("/:id", (req, res) => {
  const current = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
  if (!current) return res.status(404).json({ message: "User not found" });

  const isPrimary = current.id === "ARIJIT";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : current.name;
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : (current.email || "");
  const requestedRole = req.body?.role;
  const role = isPrimary ? "admin" : (["admin", "member"].includes(requestedRole) ? requestedRole : current.role);
  const active = isPrimary ? true : (typeof req.body?.active === "boolean" ? req.body.active : Boolean(current.active));
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !["admin", "member"].includes(role)) {
    return res.status(400).json({ message: "Invalid user data" });
  }

  const passwordHash = password ? bcrypt.hashSync(password, 12) : current.password_hash;
  db.prepare(`
    UPDATE users
    SET name=?,email=?,role=?,active=?,password_hash=?,updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(name, email, role, active ? 1 : 0, passwordHash, current.id);

  res.json({ user: safe(db.prepare("SELECT * FROM users WHERE id=?").get(current.id)) });
});

router.delete("/:id", (req, res) => {
  if (req.params.id === "ARIJIT") {
    return res.status(400).json({ message: "The primary admin cannot be deleted" });
  }
  const result = db.prepare("DELETE FROM users WHERE id=?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ message: "User not found" });
  res.json({ ok: true });
});

export default router;
