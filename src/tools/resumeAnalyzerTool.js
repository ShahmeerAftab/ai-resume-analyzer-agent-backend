import analyzeResume from "../services/aiServices.js";

export const resumeAnalyzerTool = {
  name: "resume_analyzer",
  description: "Reads a resume and scores it — also finds strengths, weaknesses, and missing skills.",

  async execute({ resumeText }) {
    if (!resumeText?.trim()) throw new Error("[resumeAnalyzerTool] resumeText is required");

    const result = await analyzeResume(resumeText);

    return {
      isResume:        result.isResume,
      atsScore:        result.atsScore,
      strengths:       result.strengths,
      weaknesses:      result.weaknesses,
      missingSkills:   result.missingSkills,
      skillKeywords:   result.skillKeywords,
      recommendations: result.recommendations,
    };
  },
};
