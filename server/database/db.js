import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeSchema } from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// IMPORTANT: production data must live outside the deployable source tree.
// Render users should mount a Persistent Disk at /var/data and set
// VEXORA_DATA_DIR=/var/data/vexora. Local development falls back to server/data.
const configuredDataDir = process.env.VEXORA_DATA_DIR?.trim();
const dataDir = configuredDataDir
  ? path.resolve(configuredDataDir)
  : path.resolve(__dirname, "../data");

fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");
const backupDir = path.join(dataDir, "backups");
fs.mkdirSync(backupDir, { recursive: true });

// Keep a rolling copy before every process start. This protects the database
// from accidental destructive changes while still keeping the active DB stable.
function createStartupBackup() {
  if (!fs.existsSync(dbPath)) return;
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(dbPath, path.join(backupDir, `app-${stamp}.db`));
    const files = fs.readdirSync(backupDir)
      .filter((name) => /^app-.*\.db$/.test(name))
      .map((name) => ({ name, mtime: fs.statSync(path.join(backupDir, name)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    for (const old of files.slice(10)) fs.rmSync(path.join(backupDir, old.name), { force: true });
  } catch (error) {
    console.warn("VEXORA database backup warning:", error.message);
  }
}

createStartupBackup();

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
initializeSchema(db);

export const DATA_DIR = dataDir;
export const DB_PATH = dbPath;
export const UPLOADS_DIR = process.env.VEXORA_UPLOADS_DIR?.trim()
  ? path.resolve(process.env.VEXORA_UPLOADS_DIR.trim())
  : path.join(dataDir, "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

process.on("SIGINT", () => { try { db.close(); } finally { process.exit(0); } });
process.on("SIGTERM", () => { try { db.close(); } finally { process.exit(0); } });
