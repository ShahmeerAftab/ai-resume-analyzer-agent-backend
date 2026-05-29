import fs from "fs";
import extractTextFromPDF from "../services/pdfService.js";
import analyzeResume from "../services/aiServices.js";
import { saveResume, fetchAllResumes, fetchResumeById, removeResume } from "../services/resumeServices.js";

// POST /api/resume/upload
const uploadResumeController = async (req, res, next) => {
  if (!req.file) {
    res.status(400);
    return next(new Error("No file uploaded"));
  }

  try {
    const extractedText = await extractTextFromPDF(req.file.path);
    const analysis      = await analyzeResume(extractedText);

    if (!analysis.isResume) {
      fs.unlink(req.file.path, () => {});
      res.status(422);
      return next(new Error("The uploaded file does not appear to be a resume or CV. Please upload a valid resume."));
    }

    const resume = await saveResume({ file: req.file, extractedText, analysis });

    res.status(201).json({
      success: true,
      message: "Resume analyzed successfully",
      data: {
        id:              resume._id,
        filename:        resume.filename,
        fileSize:        resume.fileSize,
        status:          resume.status,
        uploadedAt:      resume.createdAt,
        atsScore:        resume.atsScore,
        strengths:       resume.strengths,
        weaknesses:      resume.weaknesses,
        missingSkills:   resume.missingSkills,
        recommendations: resume.recommendations,
        recommendedJobs: resume.recommendedJobs,
      },
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// GET /api/resume
const getAllResumes = async (_req, res, next) => {
  try {
    const resumes = await fetchAllResumes();
    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (err) {
    next(err);
  }
};

// GET /api/resume/:id
const getResumeById = async (req, res, next) => {
  try {
    const resume = await fetchResumeById(req.params.id);

    if (!resume) {
      res.status(404);
      return next(new Error("Resume not found"));
    }

    res.json({ success: true, data: resume });
  } catch (err) {
    if (err.name === "CastError") {
      res.status(400);
      return next(new Error("Invalid resume ID"));
    }
    next(err);
  }
};

// DELETE /api/resume/:id
const deleteResume = async (req, res, next) => {
  try {
    const resume = await removeResume(req.params.id);

    if (!resume) {
      res.status(404);
      return next(new Error("Resume not found"));
    }

    fs.unlink(resume.filePath, () => {});
    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    if (err.name === "CastError") {
      res.status(400);
      return next(new Error("Invalid resume ID"));
    }
    next(err);
  }
};

export { uploadResumeController, getAllResumes, getResumeById, deleteResume };
