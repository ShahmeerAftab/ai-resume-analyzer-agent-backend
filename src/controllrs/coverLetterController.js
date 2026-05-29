import { fetchResumeById } from "../services/resumeServices.js";
import { generateCoverLetter } from "../services/aiServices.js";

// POST /api/resume/cover-letter
const coverLetterController = async (req, res, next) => {
  try {
    const { resumeId, companyName, jobRole } = req.body;

    if (!resumeId || !companyName?.trim() || !jobRole?.trim()) {
      res.status(400);
      return next(new Error("resumeId, companyName, and jobRole are required"));
    }

    const resume = await fetchResumeById(resumeId);
    if (!resume) {
      res.status(404);
      return next(new Error("Resume not found"));
    }

    if (!resume.extractedText || resume.extractedText.trim().length < 50) {
      res.status(400);
      return next(new Error("Resume text is too short to generate a cover letter"));
    }

    const coverLetter = await generateCoverLetter(
      resume.extractedText,
      companyName.trim(),
      jobRole.trim()
    );

    res.status(200).json({ success: true, data: { coverLetter } });
  } catch (err) {
    next(err);
  }
};

export { coverLetterController };
