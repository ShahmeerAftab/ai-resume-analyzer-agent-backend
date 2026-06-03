import express from "express";
import {
  careerAgentController,
  getRecentWorkflows,
  getWorkflowsByResume,
  getWorkflowById,
  deleteWorkflow,
} from "../controllers/careerAgentController.js";

const router = express.Router();

// Run agent pipeline
router.post("/analyze", careerAgentController);
// Workflow history
router.get("/history", getRecentWorkflows);
router.get("/history/:resumeId", getWorkflowsByResume);
router.get("/workflow/:id", getWorkflowById);
router.delete("/workflow/:id", deleteWorkflow);

export default router;
