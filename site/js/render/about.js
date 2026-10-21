import { h, safeUrl, mount } from "./dom.js";

// Profile details as a terminal panel, with the avatar when available.
export function render(target, data) {
  const { profile = {} } = data;
  const rows = [
    ["name", profile.name],
    ["handle", profile.handle && `@${profile.handle}`],
    ["university", profile.university],
    ["degree", profile.degree],
    ["year", profile.year],
  ].filter(([, value]) => value);

  const avatar = safeUrl(profile.avatar);

  mount(
    target,
    h(
      "div",
      { class: "about" },
      avatar &&
        h("img", {
          class: "about__avatar",
          src: avatar,
          alt: profile.name ? `Avatar of ${profile.name}` : "Avatar",
          width: 160,
          height: 160,
          loading: "lazy",
          decoding: "async",
        }),
      h(
        "div",
        { class: "terminal about__panel" },
        h("div", { class: "terminal__bar" }, h("span", {}, "profile.json")),
        h(
          "dl",
          { class: "terminal__body kv" },
          rows.map(([key, value]) => [h("dt", {}, key), h("dd", {}, value)])
        )
      )
    )
  );
}
