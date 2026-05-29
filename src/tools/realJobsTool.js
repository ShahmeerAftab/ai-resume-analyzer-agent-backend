import { searchJobs } from "../services/jobSearchService.js";

// checks how many of the resume's skills appear in a job listing
// returns a score (0-100) and which skills matched

function scoreJob(job, skills) {
  const haystack = [
    job.title,
    job.description,
    ...job.tags,
  ].join(" ").toLowerCase();

  const matched = skills.filter((s) => s && haystack.includes(s.toLowerCase()));

  return {
    matchScore:    skills.length > 0
      ? Math.round((matched.length / skills.length) * 100)
      : 0,
    matchedSkills: matched,
  };
}

export const realJobsTool = {
  name: "real_job_search",
  description: "Finds real job listings and ranks them by how well they match the resume.",

  async execute({ skills = [], jobTitles = [], location = "" }) {
    if (!jobTitles.length) return { listings: [] };

    // Build search queries from the top 3 job titles (no need to search all of them)
    const queries = jobTitles
      .slice(0, 3)
      .map((t) => (location ? `${t} in ${location}` : t));

    // Search all queries at the same time instead of one by one (faster).
    // allSettled means if one search fails, the others still complete.
    const settled = await Promise.allSettled(queries.map((q) => searchJobs(q)));

    // Combine results from all searches and remove duplicate jobs
    const seen = new Set();
    const all  = [];
    for (const result of settled) {
      if (result.status !== "fulfilled") {
        console.error("[realJobsTool] search failed:", result.reason?.message);
        continue;
      }
      for (const job of result.value) {
        if (job.id && !seen.has(job.id)) {
          seen.add(job.id);
          all.push(job);
        }
      }
    }

    // Score each job and sort by best match first
    const scored = [];
    for (const job of all) {
      const { matchScore, matchedSkills } = scoreJob(job, skills);
      scored.push({ ...job, matchScore, matchedSkills });
    }
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Only keep jobs where at least 20% of the resume's skills match.
    // If too few pass that bar, just return the top results anyway so the page isn't empty.
    const MIN_SCORE  = 20;
    const MAX_RETURN = 5;

    const aboveBar = skills.length > 0
      ? scored.filter((j) => j.matchScore >= MIN_SCORE)
      : scored;

    const listings = (aboveBar.length >= 2 ? aboveBar : scored).slice(0, MAX_RETURN);

    return { listings };
  },
};
