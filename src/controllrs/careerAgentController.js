import { runCareerAgent } from "../agents/careerAgent.js";
import { fetchResumeById } from "../services/resumeServices.js";
import {
  saveWorkflow,
  fetchWorkflowsByResumeId,
  fetchWorkflowById,
  fetchRecentWorkflows,
  removeWorkflow,
} from "../services/agentWorkflowService.js";

// ── POST /api/agent/analyze ───────────────────────────────────────────────────
export const careerAgentController = async (req, res, next) => {
  const { resumeId, companyName, jobRole, location } = req.body;

  if (!resumeId) {
    res.status(400);
    return next(new Error("resumeId is required"));
  }

  const startedAt = Date.now();

  try {
    // Run the full agent pipeline
    const result = await runCareerAgent(resumeId, { companyName, jobRole, location });

    const durationMs = Date.now() - startedAt;

    // Fetch lightweight resume snapshot for the history record
    const resume = await fetchResumeById(resumeId).catch(() => null);

    // Persist workflow — fire-and-forget; never fail the API response over a save error
    saveWorkflow({
      resumeId,
      resumeSnapshot: {
        filename: resume?.filename ?? "",
        fileSize: resume?.fileSize ?? 0,
        atsScore: result.resumeAnalysis?.atsScore ?? 0,
      },
      companyName: companyName ?? null,
      jobRole:     jobRole     ?? null,
      result,
      status:     "completed",
      durationMs,
    }).catch((err) => console.error("[careerAgent] workflow save failed:", err.message));

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const durationMs = Date.now() - startedAt;

    // Record the failed run (best-effort)
    saveWorkflow({
      resumeId,
      companyName: companyName ?? null,
      jobRole:     jobRole     ?? null,
      status:      "failed",
      durationMs,
      error:       err.message,
    }).catch(() => {});

    if (err.status) res.status(err.status);
    next(err);
  }
};

// ── GET /api/agent/history ────────────────────────────────────────────────────
export const getRecentWorkflows = async (_req, res, next) => {
  try {
    const workflows = await fetchRecentWorkflows(20);
    res.status(200).json({ success: true, data: workflows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/agent/history/:resumeId ─────────────────────────────────────────
export const getWorkflowsByResume = async (req, res, next) => {
  try {
    const workflows = await fetchWorkflowsByResumeId(req.params.resumeId);
    res.status(200).json({ success: true, data: workflows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/agent/workflow/:id ───────────────────────────────────────────────
export const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await fetchWorkflowById(req.params.id);
    if (!workflow) {
      res.status(404);
      return next(new Error("Workflow not found"));
    }
    res.status(200).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/agent/workflow/:id ────────────────────────────────────────────
export const deleteWorkflow = async (req, res, next) => {
  try {
    const deleted = await removeWorkflow(req.params.id);
    if (!deleted) {
      res.status(404);
      return next(new Error("Workflow not found"));
    }
    res.status(200).json({ success: true, message: "Workflow deleted" });
  } catch (err) {
    next(err);
  }
};
