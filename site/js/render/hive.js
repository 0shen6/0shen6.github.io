import { h, link, mount } from "./dom.js";

export function render(target, data) {
  const hive = data.hive || {};
  // Entries still marked "TODO: fill in" in site.json are placeholders; don't publish them.
  const contributions = (Array.isArray(hive.contributions) ? hive.contributions : []).filter(
    (c) => c && c.title && !(typeof c.note === "string" && c.note.startsWith("TODO"))
  );

  mount(
    target,
    h(
      "div",
      { class: "hive" },
      h(
        "div",
        { class: "hive__intro stack" },
        hive.role && h("p", {}, h("span", { class: "tag tag--warn" }, hive.role)),
        h("p", { class: "hive__summary" }, hive.summary)
      ),
      contributions.length > 0 &&
        h(
          "ol",
          {
            // A lone entry gets no connecting rail; a dashed line to nowhere looks unfinished.
            class: contributions.length === 1 ? "timeline timeline--single" : "timeline",
            "aria-label": "Hive contributions",
          },
          contributions.map((c) =>
            h(
              "li",
              { class: "timeline__item" },
              h("h3", { class: "timeline__title" }, c.url ? link(c.url, {}, c.title) : c.title),
              c.description && h("p", { class: "timeline__body" }, c.description)
            )
          )
        )
    )
  );
}
