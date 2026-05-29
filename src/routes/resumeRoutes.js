import express from "express";
import uploadResume from "../middlewear/uploadMiddlewear.js";
import {
  uploadResumeController,
  getAllResumes,
  getResumeById,
  deleteResume,
} from "../controllrs/resumeController.js";
import { coverLetterController } from "../controllrs/coverLetterController.js";

const router = express.Router();

router.post("/upload",        uploadResume, uploadResumeController);
router.post("/cover-letter",  coverLetterController);
router.get("/",               getAllResumes);
router.get("/:id",            getResumeById);
router.delete("/:id",         deleteResume);

export default router;
