import { h, link, tags, mount } from "./dom.js";

function card(project) {
  const titleId = `project-${project.slug}`;
  const page = project.page;

  return h(
    "li",
    { class: `project${project.featured ? " project--featured" : ""}` },
    h(
      "article",
      { class: `card${project.featured ? " card--featured" : ""}`, "aria-labelledby": titleId },
      project.featured && h("p", { class: "card__meta" }, "★ featured"),
      h("h3", { class: "card__title", id: titleId }, page ? link(page, {}, project.title) : project.title),
      h("p", { class: "card__body" }, project.summary),
      project.featured &&
        Array.isArray(project.highlights) &&
        project.highlights.length > 0 &&
        h("ul", { class: "project__highlights" }, project.highlights.map((item) => h("li", {}, item))),
      tags(project.tech, "accent"),
      h(
        "div",
        { class: "card__footer" },
        project.repo && link(project.repo, { class: "btn btn--ghost" }, "Repository"),
        page && link(page, { class: "btn" }, "Read more", h("span", { class: "visually-hidden" }, ` about ${project.title}`))
      )
    )
  );
}

export function render(target, data) {
  const projects = Array.isArray(data.projects) ? [...data.projects] : [];
  // Featured first, otherwise keep data order.
  projects.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  mount(target, h("ul", { class: "projects grid", role: "list" }, projects.map(card)));
}
