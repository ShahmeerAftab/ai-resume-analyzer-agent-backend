import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── RESUME ANALYSIS ───────────────────────────────────────────────────────────

const buildResumeAnalysisPrompt = (resumeText) => `
You are an expert ATS (Applicant Tracking System) resume analyzer.

STEP 1 — Decide if the document is a resume or CV.
A resume/CV must contain at least: contact information, work experience or education, and skills.
If the document is NOT a resume or CV (e.g. an invoice, article, book, form, or unrelated PDF), return exactly:
{ "isResume": false, "atsScore": 0, "strengths": [], "weaknesses": [], "missingSkills": [], "recommendations": [], "recommendedJobs": [] }

STEP 2 — If it IS a resume, return ONLY this JSON (no extra text):
{
  "isResume": true,
  "atsScore": number 0-100 scored by these exact criteria (be strict and consistent):
    - Contact info present and complete: up to 10 pts
    - Clear section headings (Experience, Education, Skills, etc.): up to 10 pts
    - Quantified achievements with numbers/metrics: up to 20 pts
    - Relevant keyword density for the candidate's field: up to 25 pts
    - Work experience detail and recency: up to 20 pts
    - Education, certifications, and extras: up to 15 pts,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingSkills": [{ "skill": "string", "importance": "high" | "medium" | "low" }],
  "skillKeywords": ["string"],
  "recommendations": ["string"],
  "recommendedJobs": ["string"]
}

Rules:
- "recommendedJobs": 3-6 specific job titles matching the candidate's actual skills and seniority
- "strengths" and "weaknesses": 3-6 items each, specific to this resume — not generic advice
- "skillKeywords": every specific technical skill, programming language, framework, tool, platform, or methodology
- Be objective and consistent — the same resume should always produce the same score

Document:
${resumeText}
`;

const analyzeResume = async (resumeText) => {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error("Resume text is too short to analyze");
  }

  // temperature:0 = consistent answers, response_format = forces JSON output
  const aiResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildResumeAnalysisPrompt(resumeText) }],
  });

  const rawJson = aiResponse.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  // safe fallbacks in case AI skips or misspells a field
  const isResume       = parsed.isResume !== false;
  const atsScore       = Number(parsed.atsScore) || 0;
  const strengths      = Array.isArray(parsed.strengths)       ? parsed.strengths       : [];
  const weaknesses     = Array.isArray(parsed.weaknesses)      ? parsed.weaknesses      : [];
  const recommendations= Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  const recommendedJobs= Array.isArray(parsed.recommendedJobs) ? parsed.recommendedJobs : [];
  const skillKeywords  = Array.isArray(parsed.skillKeywords)   ? parsed.skillKeywords.map(String) : [];

  // AI sometimes returns a plain string instead of { skill, importance } object
  let missingSkills = [];
  if (Array.isArray(parsed.missingSkills)) {
    missingSkills = parsed.missingSkills.map((item) => {
      if (typeof item === "string") return { skill: item, importance: "medium" };
      return { skill: item.skill || item, importance: item.importance || "medium" };
    });
  }

  return { isResume, atsScore, strengths, weaknesses, missingSkills, skillKeywords, recommendations, recommendedJobs };
};

export default analyzeResume;

// ── COVER LETTER ──────────────────────────────────────────────────────────────

const buildCoverLetterPrompt = (resumeText, companyName, jobRole) => `
You are a senior career coach. Write a compelling, highly personalised cover letter.

Target company: ${companyName}
Target role:    ${jobRole}

Candidate resume:
${resumeText}

Instructions:
- Extract from the resume: full name, email, phone number, LinkedIn/portfolio URL (if present)
- Start the letter with a header block in this exact format (omit any line whose value is missing):
  [Full Name]
  [Email] | [Phone] | [LinkedIn or Portfolio URL]

- Then write the letter body — 4 short paragraphs:
  1. Strong opening hook (why this role, why this company)
  2. Relevant skills and experience backed by specifics from the resume
  3. Why this company specifically — show genuine interest
  4. Confident closing with a call to action

- End with:
  Sincerely,
  [Full Name]

- Use the candidate's name ONLY in the header and the final sign-off
- Extract and use real contact details — never use placeholders like [Your Name] or [Date]
- Confident, professional, human tone — not generic
- Return ONLY the cover letter text — no explanations, no JSON, no markdown
`;

export const generateCoverLetter = async (resumeText, companyName, jobRole) => {
  // temperature 0.65 = slight creativity so the letter sounds natural
  const aiResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.65,
    messages: [{ role: "user", content: buildCoverLetterPrompt(resumeText, companyName, jobRole) }],
  });

  const coverLetter = aiResponse.choices[0].message.content?.trim();
  if (!coverLetter) throw new Error("AI failed to generate a cover letter. Please try again.");

  return coverLetter;
};

// ── LEARNING ROADMAP ──────────────────────────────────────────────────────────

const buildRoadmapPrompt = (missingSkills, targetJobs) => `
You are a senior technical career coach. Build a phased learning roadmap.

Target roles: ${targetJobs.join(", ")}

Skills to learn:
${missingSkills.map((s) => `- ${s.skill} (${s.importance} priority)`).join("\n")}

Return ONLY valid JSON in this exact shape:
{
  "totalDuration": "X-Y weeks",
  "phases": [
    {
      "phase": 1,
      "title": "string",
      "duration": "X weeks",
      "skills": [
        {
          "skill": "string",
          "why": "one sentence — why this skill matters for the target roles",
          "resources": ["up to 3 free resources (official docs, YouTube, freeCodeCamp, etc.)"],
          "action": "one concrete mini-project or hands-on task to practise this skill"
        }
      ]
    }
  ]
}

Rules:
- Phase 1 = high-priority skills, Phase 2 = medium, Phase 3 = low (omit if empty)
- Each phase is 1-3 weeks; keep resources free and accessible
- Be specific — no generic advice
`;

export const generateLearningRoadmap = async (missingSkills, targetJobs) => {
  if (!missingSkills || missingSkills.length === 0) return { totalDuration: "0 weeks", phases: [] };

  const aiResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildRoadmapPrompt(missingSkills, targetJobs) }],
  });

  let parsed;
  try {
    parsed = JSON.parse(aiResponse.choices[0].message.content);
  } catch {
    throw new Error("AI returned invalid roadmap JSON. Please try again.");
  }

  return {
    totalDuration: parsed.totalDuration || "Unknown",
    phases: Array.isArray(parsed.phases) ? parsed.phases : [],
  };
};

// ── IMPROVEMENT SUGGESTIONS (used when ATS score < 70) ───────────────────────

const buildImprovementPrompt = (resumeText, atsScore, weaknesses) => `
You are an expert resume coach. The candidate's resume scored ${atsScore}/100 on ATS evaluation.

Identified weaknesses:
${weaknesses.map((w) => `- ${w}`).join("\n")}

Resume:
${resumeText}

Generate targeted, actionable improvement suggestions to raise the ATS score above 70.
Return ONLY valid JSON in this exact shape:
{
  "summary": "one sentence explaining the biggest gap",
  "suggestions": [
    {
      "area": "string (e.g. Quantified Achievements, Keywords, Contact Info)",
      "priority": "high" | "medium" | "low",
      "action": "specific, concrete action the candidate should take",
      "example": "optional — a before/after example if helpful"
    }
  ]
}

Rules:
- 4-8 suggestions, ordered by priority (high first)
- Be specific to this resume — no generic advice
- Focus on changes that directly improve ATS scoring
`;

export const generateImprovements = async (resumeText, atsScore, weaknesses) => {
  const aiResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildImprovementPrompt(resumeText, atsScore, weaknesses) }],
  });

  let parsed;
  try {
    parsed = JSON.parse(aiResponse.choices[0].message.content);
  } catch {
    throw new Error("AI returned invalid improvements JSON. Please try again.");
  }

  return {
    summary:     parsed.summary     || "",
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
};
