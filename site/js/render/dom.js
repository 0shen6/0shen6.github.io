// Tiny DOM helpers for renderers. Data only ever reaches the page through
// textContent and setAttribute, never innerHTML.

// h("a", { class: "btn", href: url }, "text", childNode, [more, children])
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    el.setAttribute(key, value === true ? "" : String(value));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(el, child);
    else if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }
}

// Only http(s) and relative URLs; anything else (javascript:, data:) is dropped.
export function safeUrl(url) {
  if (typeof url !== "string" || url.trim() === "") return null;
  try {
    const parsed = new URL(url, document.baseURI);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function isExternal(url) {
  try {
    return new URL(url, document.baseURI).origin !== location.origin;
  } catch {
    return false;
  }
}

// Link with rel/target set for external URLs. Returns a <span> if the URL is unsafe.
export function link(url, attrs, ...children) {
  const href = safeUrl(url);
  if (!href) return h("span", { class: attrs && attrs.class }, ...children);
  const ext = isExternal(href);
  return h("a", { ...attrs, href, rel: ext ? "noopener noreferrer" : null }, ...children);
}

export function tags(items, modifier = "") {
  const list = Array.isArray(items) ? items.filter((t) => typeof t === "string" && t) : [];
  if (!list.length) return null;
  return h(
    "ul",
    { class: "tags", role: "list" },
    list.map((t) => h("li", { class: `tag${modifier ? ` tag--${modifier}` : ""}` }, t))
  );
}

export function mount(target, ...nodes) {
  target.replaceChildren(...nodes.flat().filter(Boolean));
}
