import AgentWorkflow from "../models/AgentWorkflow.js";

// saves a completed/failed agent run to MongoDB
export async function saveWorkflow(data) {
  const {
    resumeId,
    resumeSnapshot  = {},
    companyName     = null,
    jobRole         = null,
    result          = {},
    status          = "completed",
    durationMs      = 0,
    error           = null,
  } = data;

  const doc = new AgentWorkflow({
    resumeId,
    resumeSnapshot,
    companyName,
    jobRole,
    analysis:               result.resumeAnalysis         ?? null,
    currentSkills:          result.currentSkills          ?? [],
    prioritizeFrontend:     result.prioritizeFrontend     ?? false,
    jobSuggestions:         result.jobSuggestions         ?? [],
    missingSkills:          result.missingSkills          ?? [],
    improvementSuggestions: result.improvementSuggestions ?? { summary: null, suggestions: [] },
    learningRoadmap:        result.learningRoadmap        ?? { totalDuration: null, phases: null },
    realJobListings:        result.realJobListings        ?? [],
    coverLetter:            result.coverLetter            ?? null,
    status,
    durationMs,
    error,
  });

  return doc.save();
}

// all runs for one resume, newest first
export async function fetchWorkflowsByResumeId(resumeId) {
  return AgentWorkflow.find({ resumeId }).sort({ createdAt: -1 }).select("-__v").lean();
}

// one run by its MongoDB ID
export async function fetchWorkflowById(id) {
  return AgentWorkflow.findById(id).select("-__v").lean();
}

// latest N runs across all resumes — heavy fields hidden to keep response small
export async function fetchRecentWorkflows(limit = 20) {
  return AgentWorkflow
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-__v -learningRoadmap.phases -coverLetter")
    .populate("resumeId", "filename atsScore status createdAt") // replaces ID with actual resume data
    .lean(); // plain JS object, faster than full Mongoose document
}

// permanently deletes one workflow record
export async function removeWorkflow(id) {
  return AgentWorkflow.findByIdAndDelete(id);
}
