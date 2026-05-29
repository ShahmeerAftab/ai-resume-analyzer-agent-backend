import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import agentRoutes  from "./routes/agentRoutes.js";

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "AI Resume Analyzer API is running" });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// app.use("/api/auth",   require("./routes/auth.routes"));
app.use("/api/resume", resumeRoutes);
app.use("/api/agent",  agentRoutes);
// app.use("/api/public", require("./routes/public.routes"));

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
