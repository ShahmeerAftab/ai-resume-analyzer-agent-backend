import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";


const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // allow cookies and auth headers to be included in requests
  })
);


//   express.urlencoded() → reads HTML form data  (Content-Type: application/x-www-form-urlencoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────────────────────
// A simple endpoint that returns "OK". Useful for checking that the server
// is up, especially on deployment platforms.
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "AI Resume Analyzer API is running" });
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Each router handles a group of related endpoints:
//   /api/resume/* → uploading, viewing, and deleting resumes
//   /api/agent/*  → AI agent features (career advice, etc.)
app.use("/api/resume", resumeRoutes);
app.use("/api/agent", agentRoutes);

// ── Error Handling 
app.use(notFound);
app.use(errorHandler);

export default app;
