import { h, link, safeUrl, mount } from "./dom.js";

// Lists only the links present in data; nothing is hard-coded here.
export function render(target, data) {
  const links = (Array.isArray(data.links) ? data.links : []).filter((l) => l && safeUrl(l.url));
  const name = data.profile && data.profile.name;

  mount(
    target,
    h("p", { class: "muted" }, name ? `The best way to reach ${name} is through:` : "Find me here:"),
    h(
      "ul",
      { class: "cluster contact__links", role: "list" },
      links.map((l) =>
        h("li", {}, link(l.url, { class: "btn btn--primary" }, l.label, h("span", { class: "contact__url mono" }, prettyUrl(l.url))))
      )
    )
  );
}

function prettyUrl(url) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
