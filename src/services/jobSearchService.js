// Searches jobs from JSearch (LinkedIn/Indeed) if RAPIDAPI_KEY exists, else Arbeitnow (free)

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// removes HTML tags → plain text 
function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// converts API job type codes to readable labels  e.g. "FULLTIME" → "Full-time"
function formatJobType(raw = "") {
  const map = {
    fulltime: "Full-time", full_time: "Full-time", FULLTIME: "Full-time",
    parttime: "Part-time", part_time: "Part-time", PARTTIME: "Part-time",
    contract: "Contract",  CONTRACT:  "Contract",
    internship: "Internship", intern: "Internship", INTERN: "Internship",
  };
  if (map[raw]) return map[raw];
  if (raw) return raw.replace(/[_-]/g, " ");
  return "Full-time";
}

// ── SOURCE 1: JSearch (LinkedIn & Indeed) ────────────────────────────────────

async function searchJSearch(query) {
  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query",       query);
  url.searchParams.set("page",        "1");
  url.searchParams.set("num_pages",   "1");
  url.searchParams.set("date_posted", "month");

  const response = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key":  RAPIDAPI_KEY,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`JSearch error ${response.status}: ${body.slice(0, 120)}`);
  }

  const json = await response.json();

  // map API fields → our own consistent job shape
  return (json.data ?? []).map((job) => ({
    id:          job.job_id            ?? String(Math.random()),
    title:       job.job_title         ?? "Unknown Title",
    company:     job.employer_name     ?? "Unknown",
    companyLogo: job.employer_logo     ?? null,
    location: [job.job_city, job.job_state, job.job_country]
      .filter(Boolean).join(", ") || "Remote", // skip nulls, fallback to "Remote"
    remote:      job.job_is_remote     ?? false,
    type:        formatJobType(job.job_employment_type),
    postedAt:    job.job_posted_at_datetime_utc ?? null,
    applyUrl:    job.job_apply_link    ?? null,
    description: stripHtml(job.job_description ?? "").slice(0, 500), // max 500 chars
    tags: [
      ...(job.job_required_skills            ?? []),
      ...(job.job_highlights?.Qualifications ?? []),
    ].map((t) => String(t).toLowerCase()),
    source: "LinkedIn & Indeed",
    salary: null,
  }));
}

// ── SOURCE 2: Arbeitnow (free fallback, no key needed) ───────────────────────

async function searchArbeitnow(query) {
  const url = new URL("https://www.arbeitnow.com/api/job-board-api");
  url.searchParams.set("search", query);

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Arbeitnow error ${response.status}`);

  const json = await response.json();

  return (json.data ?? []).map((job) => ({
    id:          job.slug         ?? String(Math.random()),
    title:       job.title        ?? "Unknown Title",
    company:     job.company_name ?? "Unknown",
    companyLogo: null,
    location:    job.location     || (job.remote ? "Remote" : ""),
    remote:      job.remote       ?? false,
    type:        formatJobType(Array.isArray(job.job_types) ? job.job_types[0] : ""),
    postedAt:    job.created_at ? new Date(job.created_at * 1000).toISOString() : null, // Unix → ISO
    applyUrl:    job.url          ?? null,
    description: stripHtml(job.description ?? "").slice(0, 500),
    tags:        (job.tags ?? []).map((t) => String(t).toLowerCase()),
    source:      "Arbeitnow",
    salary:      null,
  }));
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

// use JSearch if key exists in .env, otherwise fall back to free Arbeitnow
export async function searchJobs(query) {
  if (RAPIDAPI_KEY) return searchJSearch(query);
  return searchArbeitnow(query);
}
