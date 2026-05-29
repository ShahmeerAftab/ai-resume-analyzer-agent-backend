import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const buildPrompt = (resumeText, currentSkills, prioritizeFrontend) => `
You are a career specialist. Recommend 5-8 specific job titles for this candidate.

${currentSkills.length > 0
  ? `Candidate's confirmed current skills: ${currentSkills.join(", ")}\nPrioritise roles where these skills are directly applicable.`
  : ""}
${prioritizeFrontend
  ? "IMPORTANT: This candidate has strong frontend skills. Make at least 3 of the 5-8 recommendations frontend-specific roles (e.g. React Developer, Frontend Engineer, UI Engineer)."
  : ""}

Return ONLY valid JSON: { "jobs": ["string"] }

Rules:
- Specific titles only (e.g. "Senior React Developer", not "Developer")
- Match the candidate's actual experience level and domain
- Cover slightly different career paths the candidate could realistically pursue

Resume:
${resumeText}
`;

export const jobRecommendationTool = {
  name: "job_recommender",
  description: "Suggests job titles that match what's in the resume.",
  async execute({ resumeText, currentSkills = [], prioritizeFrontend = false }) {
    if (!resumeText?.trim()) throw new Error("[jobRecommendationTool] resumeText is required");

    const completion = await groq.chat.completions.create({
      model:           "llama-3.3-70b-versatile",
      temperature:     0,
      response_format: { type: "json_object" },
      messages:        [{ role: "user", content: buildPrompt(resumeText, currentSkills, prioritizeFrontend) }],
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      throw new Error("[jobRecommendationTool] AI returned invalid JSON");
    }

    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  },
};
