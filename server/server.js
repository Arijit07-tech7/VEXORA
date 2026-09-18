import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import dashboardRoutes from "./routes/dashboard.js";
import taskRoutes from "./routes/tasks.js";
import assignmentRoutes from "./routes/assignments.js";
import hackathonRoutes from "./routes/hackathons.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/uploads.js";
import { UPLOADS_DIR } from "./database/db.js";
import "./database/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/health", (_req,res) => res.json({ok:true,service:"VEXORA API",status:"healthy"}));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api", (_req,res) => res.status(404).json({message:"API endpoint not found"}));

const dist = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*splat}", (req,res) => {
    if (req.path.startsWith("/api/") || req.path === "/api") return res.status(404).json({message:"API endpoint not found"});
    res.sendFile(path.join(dist, "index.html"));
  });
} else {
  app.get("/", (_req,res) => res.status(503).send("VEXORA frontend is not built. Run npm run build."));
}

app.use((err, _req, res, _next) => {
  console.error(isProduction ? "VEXORA request error" : err);
  const status = err.statusCode || 500;
  res.status(status).json({message: isProduction ? "Something went wrong" : (err.message || "Something went wrong")});
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VEXORA running on port ${PORT}`);
});
