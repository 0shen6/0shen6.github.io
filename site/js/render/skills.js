import { h, tags, mount } from "./dom.js";

export function render(target, data) {
  const groups = Array.isArray(data.skills) ? data.skills : [];

  mount(
    target,
    h(
      "ul",
      { class: "skills grid", role: "list" },
      groups.map((group) =>
        h(
          "li",
          { class: "card skills__group" },
          h("h3", { class: "card__title mono" }, `> ${group.group}`),
          tags(group.items)
        )
      )
    )
  );
}
