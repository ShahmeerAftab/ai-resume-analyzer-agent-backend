import { generateCoverLetter } from "../services/aiServices.js";

export const coverLetterTool = {
  name: "cover_letter_writer",
  description: "Writes a cover letter for the candidate based on their resume, the company, and the job role.",

  async execute({ resumeText, companyName, jobRole }) {
    if (!resumeText?.trim())  throw new Error("[coverLetterTool] resumeText is required");
    if (!companyName?.trim()) throw new Error("[coverLetterTool] companyName is required");
    if (!jobRole?.trim())     throw new Error("[coverLetterTool] jobRole is required");

    const coverLetter = await generateCoverLetter(
      resumeText,
      companyName.trim(),
      jobRole.trim()
    );

    return { coverLetter };
  },
};
