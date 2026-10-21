// Content loader: fetches data/site.json and validates its shape.
// On any failure it warns (non-fatal) and returns null, so the static
// fallback markup stays on the page.

// Resolved against this module, so pages in subfolders (projects/*.html)
// load the same file as index.html.
const DEFAULT_URL = new URL("../data/site.json", import.meta.url);

const isString = (v) => typeof v === "string" && v.trim() !== "";
const isArray = Array.isArray;
const isObject = (v) => v !== null && typeof v === "object" && !isArray(v);

function requireFields(obj, fields, path, errors) {
  for (const field of fields) {
    if (!isString(obj[field])) errors.push(`${path}.${field} must be a non-empty string`);
  }
}

// Returns a list of problems; an empty list means the data is usable.
export function validateSite(data) {
  const errors = [];
  if (!isObject(data)) return ["root must be an object"];

  const { profile, links, skills, projects, hive } = data;

  if (!isObject(profile)) {
    errors.push("profile must be an object");
  } else {
    requireFields(profile, ["name", "handle", "tagline", "bio"], "profile", errors);
  }

  if (!isArray(links)) {
    errors.push("links must be an array");
  } else {
    links.forEach((link, i) => {
      if (!isObject(link)) return errors.push(`links[${i}] must be an object`);
      requireFields(link, ["label", "url"], `links[${i}]`, errors);
    });
  }

  if (!isArray(skills)) {
    errors.push("skills must be an array");
  } else {
    skills.forEach((group, i) => {
      if (!isObject(group)) return errors.push(`skills[${i}] must be an object`);
      requireFields(group, ["group"], `skills[${i}]`, errors);
      if (!isArray(group.items)) errors.push(`skills[${i}].items must be an array`);
    });
  }

  if (!isArray(projects)) {
    errors.push("projects must be an array");
  } else {
    projects.forEach((project, i) => {
      if (!isObject(project)) return errors.push(`projects[${i}] must be an object`);
      requireFields(project, ["slug", "title", "summary"], `projects[${i}]`, errors);
      for (const list of ["tech", "highlights"]) {
        if (project[list] !== undefined && !isArray(project[list])) {
          errors.push(`projects[${i}].${list} must be an array`);
        }
      }
    });
  }

  if (!isObject(hive)) {
    errors.push("hive must be an object");
  } else {
    requireFields(hive, ["summary"], "hive", errors);
    if (!isArray(hive.contributions)) errors.push("hive.contributions must be an array");
  }

  return errors;
}

export async function loadSite({ url = DEFAULT_URL } = {}) {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

    const data = await response.json();
    const errors = validateSite(data);
    if (errors.length) throw new Error(`invalid site.json:\n- ${errors.join("\n- ")}`);

    return data;
  } catch (error) {
    console.warn("[site] Could not load content; showing static fallback.", error);
    return null;
  }
}
