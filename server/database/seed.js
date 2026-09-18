import bcrypt from "bcryptjs";
import { db } from "./db.js";

// First-install defaults. Existing records are NEVER reset, overwritten, or deleted.
const DEFAULT_ADMIN_ID = process.env.BOOTSTRAP_ADMIN_ID?.trim() || "ARIJIT";
const DEFAULT_ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Arijit";
const DEFAULT_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "ARIJIT18";
const DEFAULT_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || "";

const memberSeeds = [
  ["BB-2026-001", "Byte Buster 001"],
  ["BB-2026-002", "Byte Buster 002"],
  ["BB-2026-003", "Byte Buster 003"],
  ["BB-2026-004", "Byte Buster 004"]
];

function ensureAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE id=? COLLATE NOCASE").get(DEFAULT_ADMIN_ID);
  if (existing) return false;

  const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 12);
  db.prepare(`
    INSERT INTO users (id,name,email,password_hash,role,active)
    VALUES (?,?,?,?,?,1)
  `).run(DEFAULT_ADMIN_ID, DEFAULT_ADMIN_NAME || DEFAULT_ADMIN_ID, DEFAULT_ADMIN_EMAIL, hash, "admin");
  return true;
}

function ensureFreshInstallMembers() {
  const insert = db.prepare(`
    INSERT INTO users (id,name,email,password_hash,role,active)
    VALUES (?,?,?,?,?,1)
  `);
  for (const [id, name] of memberSeeds) {
    if (!db.prepare("SELECT id FROM users WHERE id=?").get(id)) {
      insert.run(id, name, "", bcrypt.hashSync("member123", 12), "member");
    }
  }
}

const createdAdmin = ensureAdmin();
ensureFreshInstallMembers();

console.log(createdAdmin
  ? `VEXORA bootstrap admin created: ${DEFAULT_ADMIN_ID}`
  : "VEXORA data preserved: existing admin/users were not reset.");
