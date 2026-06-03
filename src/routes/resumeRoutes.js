import express from "express";
import uploadResume from "../middleware/upload.middleware.js";
import {
  uploadResumeController,
  getAllResumes,
  getResumeById,
  deleteResume,
} from "../controllers/resumeController.js";
import { coverLetterController } from "../controllers/coverLetterController.js";


const router = express.Router();


router.post("/upload", uploadResume, uploadResumeController);
router.post("/cover-letter", coverLetterController);
router.get("/", getAllResumes);
router.get("/:id", getResumeById);
router.delete("/:id", deleteResume);

export default router;
