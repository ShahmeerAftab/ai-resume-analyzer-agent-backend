import { generateLearningRoadmap } from "../services/aiServices.js";

export const roadmapTool = {
  name: "learning_roadmap",
  description: "Creates a step-by-step learning plan for the skills the candidate is missing.",

  async execute({ missingSkills, targetJobs }) {
    if (!Array.isArray(missingSkills))
      throw new Error("[roadmapTool] missingSkills must be an array");
    if (!Array.isArray(targetJobs) || targetJobs.length === 0)
      throw new Error("[roadmapTool] targetJobs must be a non-empty array");

    const roadmap = await generateLearningRoadmap(missingSkills, targetJobs);

    return {
      totalDuration: roadmap.totalDuration,
      phases:        roadmap.phases,
    };
  },
};
