import mongoose from "mongoose";

const missingSkillSchema = new mongoose.Schema(
  {
    skill:      { type: String, required: true },
    importance: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    // File info
    filename:      { type: String, required: true },
    storedName:    { type: String, required: true },
    filePath:      { type: String, required: true },
    fileSize:      { type: Number, required: true },
    mimeType:      { type: String, required: true },

    // Extracted content
    extractedText: { type: String, default: "" },

    // AI analysis
    atsScore:        { type: Number, min: 0, max: 100, default: 0 },
    strengths:       { type: [String], default: [] },
    weaknesses:      { type: [String], default: [] },
    missingSkills:   { type: [missingSkillSchema], default: [] },
    recommendations: { type: [String], default: [] },
    recommendedJobs: { type: [String], default: [] },

    // Status
    status: {
      type:    String,
      enum:    ["uploaded", "analyzing", "done", "failed"],
      default: "uploaded",
    },
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
