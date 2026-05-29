import { generateImprovements } from "../services/aiServices.js";

export const improvementTool = {
  name: "resume_improver",
  description: "Gives specific tips to improve the resume when the ATS score is below 70.",
  async execute({ resumeText, atsScore, weaknesses }) {
    if (!resumeText?.trim()) throw new Error("[improvementTool] resumeText is required");
    if (typeof atsScore !== "number") throw new Error("[improvementTool] atsScore must be a number");

    const result = await generateImprovements(resumeText, atsScore, weaknesses ?? []);

    return {
      summary:     result.summary,
      suggestions: result.suggestions,
    };
  },
};
