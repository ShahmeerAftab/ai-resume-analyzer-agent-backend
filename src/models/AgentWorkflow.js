import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const missingSkillSchema = new mongoose.Schema(
  {
    skill:      { type: String, required: true },
    importance: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  },
  { _id: false }
);

const improvementSuggestionSchema = new mongoose.Schema(
  {
    area:     { type: String, required: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    action:   { type: String, required: true },
    example:  { type: String, default: "" },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    atsScore:        { type: Number, min: 0, max: 100, default: 0 },
    strengths:       { type: [String], default: [] },
    weaknesses:      { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const agentWorkflowSchema = new mongoose.Schema(
  {
    // Link to source resume
    resumeId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Resume",
      required: true,
      index:    true,
    },

    // Lightweight resume snapshot — avoids re-fetching the Resume doc
    resumeSnapshot: {
      filename: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
      atsScore: { type: Number, default: 0 },
    },

    // Optional cover-letter inputs
    companyName: { type: String, default: null },
    jobRole:     { type: String, default: null },

    // ── Step outputs ──────────────────────────────────────────────────────
    analysis:          { type: analysisSchema,      default: null },
    currentSkills:     { type: [String],            default: [] },
    prioritizeFrontend:{ type: Boolean,             default: false },
    jobSuggestions:    { type: [String],            default: [] },
    missingSkills:     { type: [missingSkillSchema], default: [] },

    // Conditional: only present when ATS < 70
    improvementSuggestions: {
      summary:     { type: String, default: null },
      suggestions: { type: [improvementSuggestionSchema], default: [] },
    },

    // Conditional: only present when missing skills exist
    learningRoadmap: {
      totalDuration: { type: String, default: null },
      phases:        { type: mongoose.Schema.Types.Mixed, default: null },
    },

    // Real job listings matched against candidate skills (Step 6)
    realJobListings: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Optional: only present when companyName + jobRole supplied
    coverLetter: { type: String, default: null },

    // ── Meta ──────────────────────────────────────────────────────────────
    status:     { type: String, enum: ["completed", "failed"], default: "completed" },
    durationMs: { type: Number, default: 0 },
    error:      { type: String, default: null },
  },
  { timestamps: true }
);

// Compound index for recent workflows per resume
agentWorkflowSchema.index({ resumeId: 1, createdAt: -1 });

const AgentWorkflow = mongoose.model("AgentWorkflow", agentWorkflowSchema);

export default AgentWorkflow;
