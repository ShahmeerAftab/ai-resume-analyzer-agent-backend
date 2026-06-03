import mongoose from "mongoose";

// Sub-schema for a single missing skill entry.
// { _id: false } tells Mongoose not to add an _id field to each skill object.
const missingSkillSchema = new mongoose.Schema(
  {
    skill:      { type: String, required: true },
    importance: {
      type:    String,
      enum:    ["high", "medium", "low"], // only these three values are accepted
      default: "medium",
    },
  },
  { _id: false }
);

// Defines the shape of every resume document saved in MongoDB.
// storedName and filePath are removed — we no longer save files to disk.
const resumeSchema = new mongoose.Schema(
  {
    // ── File information ────────────────────────────────────────────────────
    filename:  { type: String, required: true }, // original name the user uploaded
    fileSize:  { type: Number, required: true }, // size in bytes
    mimeType:  { type: String, required: true }, // e.g. "application/pdf"

    // ── Text extracted from the PDF ─────────────────────────────────────────
    extractedText: { type: String, default: "" },

    // ── AI analysis results ─────────────────────────────────────────────────
    atsScore:        { type: Number, min: 0, max: 100, default: 0 },
    strengths:       { type: [String], default: [] },
    weaknesses:      { type: [String], default: [] },
    missingSkills:   { type: [missingSkillSchema], default: [] },
    recommendations: { type: [String], default: [] },
    recommendedJobs: { type: [String], default: [] },

    // ── Upload/processing status ────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ["uploaded", "analyzing", "done", "failed"],
      default: "uploaded",
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields to every document
    timestamps: true,
  }
);

// Mongoose will use (or create) a MongoDB collection named "resumes"
const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
