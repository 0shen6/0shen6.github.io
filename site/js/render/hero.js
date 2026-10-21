import { h, link, mount } from "./dom.js";

export function render(target, data) {
  const { profile = {}, links = [] } = data;
  const github = links.find((l) => l && l.icon === "github") || links[0];

  mount(
    target,
    h("p", { class: "hero__eyebrow" }, "whoami"),
    h("h1", { class: "hero__title", id: "about-title" }, h("span", { class: "cursor" }, profile.name)),
    profile.tagline && h("p", { class: "hero__tagline mono" }, profile.tagline),
    h("p", { class: "hero__lead" }, profile.bio),
    h(
      "div",
      { class: "cluster hero__actions" },
      h("a", { class: "btn btn--primary", href: "#projects" }, "View projects"),
      github && link(github.url, { class: "btn" }, github.label)
    )
  );
}
