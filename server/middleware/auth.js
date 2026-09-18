import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db, DATA_DIR } from "../database/db.js";

const secretFile = path.join(DATA_DIR, ".jwt-secret");
const configuredSecret = process.env.JWT_SECRET?.trim();
const expiry = process.env.JWT_EXPIRES_IN?.trim() || "7d";

function getSecret() {
  if (configuredSecret) return configuredSecret;

  // Local-development fallback only. In production always configure JWT_SECRET
  // as a stable Render environment variable. The fallback is persisted outside
  // the source tree so a code deployment does not silently invalidate sessions
  // when a persistent data directory is configured.
  try {
    const existing = fs.readFileSync(secretFile, "utf8").trim();
    if (existing) return existing;
  } catch {}

  const generated = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return generated;
}

const SECRET = getSecret();

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const claims = jwt.verify(token, SECRET);
    const user = db.prepare("SELECT id,name,role,active FROM users WHERE id=?").get(claims.id);
    if (!user || !user.active) return res.status(401).json({ message: "Session is no longer active" });
    req.user = user;
    req.userRecord = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function signToken(user) {
  return jwt.sign({ id: user.id }, SECRET, { expiresIn: expiry });
}
