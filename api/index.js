// Vercel serverless entry point — every request to /api/* (and everything
// else, via vercel.json) is routed through this function.
import "dotenv/config";
import app from "../src/app.js";
import connectDB from "../src/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB(); // no-op if already connected (warm function reuse)
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed" });
    return;
  }

  app(req, res);
}
