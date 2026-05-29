import Resume from "../models/Resume.js";

const saveResume = async ({ file, extractedText, analysis }) => {
  const resume = await Resume.create({
    filename:        file.originalname,
    storedName:      file.filename,
    filePath:        file.path,
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

const fetchAllResumes = async () => {
  return Resume.find()
    .select("-filePath -storedName -extractedText")
    .sort({ createdAt: -1 })
    .limit(20);
};

const fetchResumeById = async (id) => {
  return Resume.findById(id).select("-filePath -storedName");
};

const removeResume = async (id) => {
  return Resume.findByIdAndDelete(id);
};

export { saveResume, fetchAllResumes, fetchResumeById, removeResume };
