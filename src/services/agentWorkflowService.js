import AgentWorkflow from "../models/AgentWorkflow.js";

/**
 * Persist a completed (or failed) agent run to MongoDB.
 *
 * @param {{
 *   resumeId: string,
 *   resumeSnapshot: { filename: string, fileSize: number, atsScore: number },
 *   companyName?: string,
 *   jobRole?: string,
 *   result?: object,       // full output from runCareerAgent
 *   status?: 'completed'|'failed',
 *   durationMs?: number,
 *   error?: string,
 * }} data
 */
export async function saveWorkflow(data) {
  const {
    resumeId,
    resumeSnapshot = {},
    companyName = null,
    jobRole     = null,
    result      = {},
    status      = "completed",
    durationMs  = 0,
    error       = null,
  } = data;

  const doc = new AgentWorkflow({
    resumeId,
    resumeSnapshot,
    companyName: companyName || null,
    jobRole:     jobRole     || null,

    analysis:            result.resumeAnalysis           ?? null,
    currentSkills:       result.currentSkills            ?? [],
    prioritizeFrontend:  result.prioritizeFrontend       ?? false,
    jobSuggestions:      result.jobSuggestions           ?? [],
    missingSkills:       result.missingSkills            ?? [],
    improvementSuggestions: result.improvementSuggestions ?? { summary: null, suggestions: [] },
    learningRoadmap:     result.learningRoadmap          ?? { totalDuration: null, phases: null },
    realJobListings:     result.realJobListings          ?? [],
    coverLetter:         result.coverLetter              ?? null,

    status,
    durationMs,
    error,
  });

  return doc.save();
}

/**
 * Fetch all workflow runs for a specific resume, newest first.
 * @param {string} resumeId
 */
export async function fetchWorkflowsByResumeId(resumeId) {
  return AgentWorkflow
    .find({ resumeId })
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();
}

/**
 * Fetch a single workflow by its own _id.
 * @param {string} id
 */
export async function fetchWorkflowById(id) {
  return AgentWorkflow
    .findById(id)
    .select("-__v")
    .lean();
}

/**
 * Fetch the most recent N workflow runs across all resumes.
 * @param {number} limit
 */
export async function fetchRecentWorkflows(limit = 20) {
  return AgentWorkflow
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-__v -learningRoadmap.phases -coverLetter")  // keep list response light
    .populate("resumeId", "filename atsScore status createdAt")
    .lean();
}

/**
 * Delete a single workflow record.
 * @param {string} id
 */
export async function removeWorkflow(id) {
  return AgentWorkflow.findByIdAndDelete(id);
}
