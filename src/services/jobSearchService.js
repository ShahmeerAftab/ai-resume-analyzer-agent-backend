// Searches for real job listings from two different sources:
//   - JSearch (LinkedIn, Indeed) — needs a RapidAPI key
//   - Arbeitnow — completely free, no key needed, used as fallback
// Both return jobs in the same format so the rest of the code doesn't care which one ran.

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// helper functions used when cleaning up API responses

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatType(raw = "") {
  const map = {
    fulltime: "Full-time", full_time: "Full-time", FULLTIME: "Full-time",
    parttime: "Part-time", part_time: "Part-time", PARTTIME: "Part-time",
    contract: "Contract",  CONTRACT:  "Contract",
    internship: "Internship", intern: "Internship", INTERN: "Internship",
  };
  return map[raw] ?? (raw ? raw.replace(/[_-]/g, " ") : "Full-time");
}

// searches LinkedIn & Indeed via JSearch (needs RAPIDAPI_KEY in .env)
async function searchJSearch(query) {
  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query",       query);
  url.searchParams.set("page",        "1");
  url.searchParams.set("num_pages",   "1");
  url.searchParams.set("date_posted", "month");

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key":  RAPIDAPI_KEY,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`JSearch ${res.status}: ${body.slice(0, 120)}`);
  }

  const json = await res.json();

  return (json.data ?? []).map((j) => ({
    id:          j.job_id ?? String(Math.random()),
    title:       j.job_title              ?? "Unknown Title",
    company:     j.employer_name          ?? "Unknown",
    companyLogo: j.employer_logo          ?? null,
    location:    [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || "Remote",
    remote:      j.job_is_remote          ?? false,
    type:        formatType(j.job_employment_type),
    postedAt:    j.job_posted_at_datetime_utc ?? null,
    applyUrl:    j.job_apply_link          ?? null,
    description: stripHtml(j.job_description ?? "").slice(0, 500),
    tags: [
      ...(j.job_required_skills               ?? []),
      ...(j.job_highlights?.Qualifications    ?? []),
    ].map((t) => String(t).toLowerCase()),
    source: "LinkedIn & Indeed",
    salary: null,
  }));
}

// free backup — no key needed, returns both remote and onsite jobs
async function searchArbeitnow(query) {
  const url = new URL("https://www.arbeitnow.com/api/job-board-api");
  url.searchParams.set("search", query);

  const res = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`);

  const json = await res.json();

  return (json.data ?? []).map((j) => ({
    id:          j.slug           ?? String(Math.random()),
    title:       j.title          ?? "Unknown Title",
    company:     j.company_name   ?? "Unknown",
    companyLogo: null,
    location:    j.location       || (j.remote ? "Remote" : ""),
    remote:      j.remote         ?? false,
    type:        formatType(Array.isArray(j.job_types) ? j.job_types[0] : ""),
    postedAt:    j.created_at
                   ? new Date(j.created_at * 1000).toISOString()
                   : null,
    applyUrl:    j.url            ?? null,
    description: stripHtml(j.description ?? "").slice(0, 500),
    tags:        (j.tags ?? []).map((t) => String(t).toLowerCase()),
    source:      "Arbeitnow",
    salary:      null,
  }));
}

// use JSearch if we have a key, otherwise fall back to Arbeitnow
export async function searchJobs(query) {
  if (RAPIDAPI_KEY) return searchJSearch(query);
  return searchArbeitnow(query);
}
