import extractTextFromPDF from "../services/pdfService.js";
import analyzeResume from "../services/aiServices.js";
import {
  saveResume,
  fetchAllResumes,
  fetchResumeById,
  removeResume,
} from "../services/resumeServices.js";

// ──────────────────────────────────────────────
// POST /api/resume/upload
// Flow: receive PDF in memory → extract text → AI analysis → save to DB → return results

const uploadResumeController = async (req, res, next) => {
  
  if (!req.file) {
    res.status(400);
    return next(new Error("No file uploaded"));
  }

  try {
    // Step 1: Extract plain text from the PDF bytes in memory
    const extractedText = await extractTextFromPDF(req.file.buffer);

    // Step 2: Send the text to the Groq AI for resume scoring and analysis
    const analysis = await analyzeResume(extractedText);

    // Step 3: If the AI says this is NOT a resume, reject it
    if (!analysis.isResume) {
      res.status(422); // 422 Unprocessable Entity — valid file, but not a resume
      return next(
        new Error(
          "The uploaded file does not appear to be a resume or CV. Please upload a valid resume."
        )
      );
    }

    // Step 4: Save the file metadata, extracted text, and AI results to MongoDB
    const resume = await saveResume({ file: req.file, extractedText, analysis });

    // Step 5: Send the analysis results back to the frontend
    res.status(201).json({ // 201 Created — a new resource was successfully saved
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
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume
// Returns a list of the 20 most recent analyzed resumes
// ─────────────────────────────────────────────────────────────────────────────
const getAllResumes = async (_req, res, next) => {
  try {
    const resumes = await fetchAllResumes();
    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume/:id
// Returns the full details of a single resume looked up by its MongoDB ID
// ─────────────────────────────────────────────────────────────────────────────
const getResumeById = async (req, res, next) => {
  try {
    const resume = await fetchResumeById(req.params.id);

    if (!resume) {
      res.status(404);
      return next(new Error("Resume not found"));
    }

    res.json({ success: true, data: resume });
  } catch (err) {
    // CastError happens when the :id in the URL is not a valid MongoDB ObjectId
    if (err.name === "CastError") {
      res.status(400);
      return next(new Error("Invalid resume ID"));
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/resume/:id
// Removes a resume from MongoDB — no file to delete since nothing is on disk
// ─────────────────────────────────────────────────────────────────────────────
const deleteResume = async (req, res, next) => {
  try {
    const resume = await removeResume(req.params.id);

    if (!resume) {
      res.status(404);
      return next(new Error("Resume not found"));
    }

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
