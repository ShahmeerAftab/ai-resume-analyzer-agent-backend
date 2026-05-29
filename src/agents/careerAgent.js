import { resumeAnalyzerTool }    from "../tools/resumeAnalyzerTool.js";
import { jobRecommendationTool } from "../tools/jobRecommendationTool.js";
import { realJobsTool }          from "../tools/realJobsTool.js";
import { roadmapTool }           from "../tools/roadmapTool.js";
import { coverLetterTool }       from "../tools/coverLetterTool.js";
import { improvementTool }       from "../tools/improvementTool.js";
import { fetchResumeById }       from "../services/resumeServices.js";

const FRONTEND_KEYWORDS = [
  "react", "vue", "angular", "svelte", "next.js", "nuxt",
  "html", "css", "javascript", "typescript", "tailwind",
  "webpack", "vite", "sass", "scss", "redux", "zustand",
  "ui", "ux", "frontend", "front-end",
];

function hasFrontendSkills(skills = []) {
  for (const skill of skills) {
    const lowerSkill = skill.toLowerCase();
    for (const keyword of FRONTEND_KEYWORDS) {
      if (lowerSkill.includes(keyword)) return true;
    }
  }
  return false;
}

// Runs all AI steps one after another.
// Each step uses the result from the previous one.
// Some steps are skipped if they're not needed (e.g. no roadmap if no missing skills).
export async function runCareerAgent(resumeId, { companyName, jobRole, location = "" } = {}) {
  // Get the resume text from the database
  const resume = await fetchResumeById(resumeId);
  if (!resume) {
    const err = new Error("Resume not found");
    err.status = 404;
    throw err;
  }
  const resumeText = resume.extractedText;

  // Step 1: analyze the resume — gives us the ATS score, skills, weaknesses etc.
  const step1 = await resumeAnalyzerTool.execute({ resumeText });

  if (!step1.isResume) {
    const err = new Error("The stored document is not a valid resume.");
    err.status = 422;
    throw err;
  }

  // Step 2: pull out what skills the candidate already has
  const step2 = { currentSkills: step1.strengths };

  // If the person has frontend skills, we'll lean toward frontend job suggestions
  const prioritizeFrontend = hasFrontendSkills(step2.currentSkills);

  // Step 3: ask AI to suggest job titles that match this person's background
  const step3 = await jobRecommendationTool.execute({
    resumeText,
    currentSkills:     step2.currentSkills,
    prioritizeFrontend,
  });

  // Step 4: grab the missing skills and pair them with the suggested jobs
  const step4 = {
    missingSkills: step1.missingSkills,
    targetJobs:    step3.jobs,
  };

  // If ATS score is below 70, generate specific tips to improve the resume
  const needsImprovement = step1.atsScore < 70;
  const step4b = needsImprovement
    ? await improvementTool.execute({
        resumeText,
        atsScore:   step1.atsScore,
        weaknesses: step1.weaknesses,
      })
    : null;

  // Step 5: build a learning roadmap, but only if there are missing skills
  const hasMissingSkills = step4.missingSkills.length > 0;
  const step5 = hasMissingSkills
    ? await roadmapTool.execute({
        missingSkills: step4.missingSkills,
        targetJobs:    step4.targetJobs,
      })
    : null;

  // Step 6: search real job listings using the candidate's tech skills as keywords.
  // skillKeywords are clean single words like "React", "Docker" — better for searching than full sentences.
  // If the AI didn't return any keywords, fall back to the missing skills list.
  const allSkillStrings =
    step1.skillKeywords?.length > 0
      ? step1.skillKeywords
      : step4.missingSkills.map((s) => s.skill);

  const step6 = await realJobsTool
    .execute({
      skills:    allSkillStrings,
      jobTitles: step3.jobs,
      location,
    })
    .catch((err) => {
      // Job search failing shouldn't break the whole analysis
      console.error("[careerAgent] real job search failed:", err.message);
      return { listings: [] };
    });

  // Step 7: generate a cover letter only if the user provided a company and role
  const step7 =
    companyName?.trim() && jobRole?.trim()
      ? await coverLetterTool.execute({ resumeText, companyName, jobRole })
      : { coverLetter: null };

  // Put everything together and return it
  return {
    resumeAnalysis: {
      atsScore:        step1.atsScore,
      strengths:       step1.strengths,
      weaknesses:      step1.weaknesses,
      recommendations: step1.recommendations,
    },
    currentSkills:          step2.currentSkills,
    prioritizeFrontend,
    jobSuggestions:         step3.jobs,
    missingSkills:          step4.missingSkills,
    improvementSuggestions: step4b,
    learningRoadmap:        step5,
    realJobListings:        step6.listings,
    coverLetter:            step7.coverLetter,
  };
}
