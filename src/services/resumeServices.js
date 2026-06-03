import Resume from "../models/Resume.js";

// saves a new resume + AI analysis to MongoDB
const saveResume = async ({ file, extractedText, analysis }) => {
  const resume = await Resume.create({
    filename:        file.originalname,
    fileSize:        file.size,
    mimeType:        file.mimetype,
    extractedText,
    status:          "done",
    atsScore:        analysis.atsScore,
    strengths:       analysis.strengths,
    weaknesses:      analysis.weaknesses,
    missingSkills:   analysis.missingSkills,
    recommendations: analysis.recommendations,
    recommendedJobs: analysis.recommendedJobs,
  });

  return resume;
};

// latest 20 resumes — extractedText hidden (too large, frontend doesn't need it)
const fetchAllResumes = async () => {
  return Resume.find().select("-extractedText").sort({ createdAt: -1 }).limit(20);
};

// one resume by MongoDB ID
const fetchResumeById = async (id) => {
  return Resume.findById(id);
};

// permanently deletes a resume from MongoDB
const removeResume = async (id) => {
  return Resume.findByIdAndDelete(id);
};

export { saveResume, fetchAllResumes, fetchResumeById, removeResume };
