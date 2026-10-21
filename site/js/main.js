// Entry point: theme + nav setup, then content rendering from site.json.
// If loading or a renderer fails, that section keeps its static fallback.

import "./theme.js";
import "./nav.js";
import { loadSite } from "./data.js";
import { render as renderHero } from "./render/hero.js";
import { render as renderAbout } from "./render/about.js";
import { render as renderProjects } from "./render/projects.js";
import { render as renderHive } from "./render/hive.js";
import { render as renderSkills } from "./render/skills.js";
import { render as renderContact } from "./render/contact.js";

const RENDERERS = {
  hero: renderHero,
  about: renderAbout,
  projects: renderProjects,
  hive: renderHive,
  skills: renderSkills,
  contact: renderContact,
};

function renderSection(name, render, data) {
  const target = document.querySelector(`[data-render="${name}"]`);
  if (!target) return;
  try {
    render(target, data);
  } catch (error) {
    console.warn(`[site] Rendering "${name}" failed; keeping fallback.`, error);
    target.replaceChildren();
    return;
  }
  const fallback = target.nextElementSibling;
  if (fallback && fallback.hasAttribute("data-fallback") && target.childNodes.length) {
    fallback.remove();
  }
}

// Highlights the nav link of the section currently in view.
function watchActiveSection() {
  const links = new Map();
  document.querySelectorAll('.nav__link[href^="#"]').forEach((a) => {
    links.set(a.getAttribute("href").slice(1), a);
  });
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const visible = new Set();
  const update = () => {
    // Topmost visible section wins.
    const current = sections.find((s) => visible.has(s));
    links.forEach((a, id) => {
      if (current && id === current.id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      update();
    },
    // A band just under the sticky header counts as "in view".
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
  );
  sections.forEach((s) => observer.observe(s));
}

async function main() {
  watchActiveSection();
  const data = await loadSite();
  if (!data) return;
  for (const [name, render] of Object.entries(RENDERERS)) renderSection(name, render, data);
}

main();
