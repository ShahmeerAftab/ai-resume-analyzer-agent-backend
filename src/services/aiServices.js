import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const buildPrompt = (resumeText) => `
You are an expert ATS (Applicant Tracking System) resume analyzer.

STEP 1 — Decide if the document is a resume or CV.
A resume/CV must contain at least: contact information, work experience or education, and skills.
If the document is NOT a resume or CV (e.g. an invoice, article, book, form, or unrelated PDF), return exactly:
{ "isResume": false, "atsScore": 0, "strengths": [], "weaknesses": [], "missingSkills": [], "recommendations": [], "recommendedJobs": [] }

STEP 2 — If it IS a resume, return ONLY this JSON (no extra text):
{
  "isResume": true,
  "atsScore": number 0–100 scored by these exact criteria (be strict and consistent):
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
- "recommendedJobs": 3–6 specific job titles matching the candidate's actual skills and seniority
- "strengths" and "weaknesses": 3–6 items each, specific to this resume — not generic advice
- "skillKeywords": every specific technical skill, programming language, framework, tool, platform, or methodology the candidate demonstrably has — single words or short noun phrases only (e.g. "React", "Node.js", "PostgreSQL", "REST APIs", "Docker", "Agile") — no sentences, no soft skills
- Be objective and consistent — the same resume should always produce the same score

Document:
${resumeText}
`;

const analyzeResume = async (resumeText) => {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error("Resume text is too short to analyze");
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildPrompt(resumeText) }],
  });

  const raw = completion.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  return {
    isResume:        parsed.isResume !== false,
    atsScore:        Number(parsed.atsScore) || 0,
    strengths:       Array.isArray(parsed.strengths)       ? parsed.strengths       : [],
    weaknesses:      Array.isArray(parsed.weaknesses)      ? parsed.weaknesses      : [],
    missingSkills:   Array.isArray(parsed.missingSkills)
      ? parsed.missingSkills.map((item) =>
          typeof item === "string"
            ? { skill: item, importance: "medium" }
            : { skill: item.skill ?? item, importance: item.importance ?? "medium" }
        )
      : [],
    skillKeywords:   Array.isArray(parsed.skillKeywords)   ? parsed.skillKeywords.map(String) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    recommendedJobs: Array.isArray(parsed.recommendedJobs) ? parsed.recommendedJobs : [],
  };
};

export default analyzeResume;

// cover letter generation

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

- Use the candidate's name ONLY in the header and the final sign-off — do NOT repeat it inside the body paragraphs
- Extract and use real contact details — never use placeholders like [Your Name], [Email], [Date]
- Confident, professional, human tone — not generic
- Return ONLY the cover letter text — no explanations, no JSON, no markdown headers
`;

// learning roadmap generation

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
  if (!missingSkills?.length) return { totalDuration: "0 weeks", phases: [] };

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildRoadmapPrompt(missingSkills, targetJobs) }],
  });

  const raw = completion.choices[0].message.content;
  try {
    const parsed = JSON.parse(raw);
    return {
      totalDuration: parsed.totalDuration ?? "Unknown",
      phases:        Array.isArray(parsed.phases) ? parsed.phases : [],
    };
  } catch {
    throw new Error("AI returned invalid roadmap JSON. Please try again.");
  }
};

// improvement suggestions — only called when ATS score is below 70

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
- 4–8 suggestions, ordered by priority (high first)
- Be specific to this resume — no generic advice
- Focus on changes that directly improve ATS scoring
`;

export const generateImprovements = async (resumeText, atsScore, weaknesses) => {
  const completion = await groq.chat.completions.create({
    model:           "llama-3.3-70b-versatile",
    temperature:     0,
    response_format: { type: "json_object" },
    messages:        [{ role: "user", content: buildImprovementPrompt(resumeText, atsScore, weaknesses) }],
  });

  try {
    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      summary:     parsed.summary ?? "",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    throw new Error("AI returned invalid improvements JSON. Please try again.");
  }
};

export const generateCoverLetter = async (resumeText, companyName, jobRole) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.65,
    messages: [{ role: "user", content: buildCoverLetterPrompt(resumeText, companyName, jobRole) }],
  });

  const coverLetter = completion.choices[0].message.content?.trim();
  if (!coverLetter) throw new Error("AI failed to generate a cover letter. Please try again.");

  return coverLetter;
};
