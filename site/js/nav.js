// Mobile nav: collapses the nav behind a toggle button on small screens.
// Without JS the nav stays visible (see .js rules in components.css).

const header = document.querySelector(".site-header");
const toggle = header && header.querySelector("[data-nav-toggle]");
const nav = header && header.querySelector(".nav");

function setOpen(open) {
  header.setAttribute("data-nav-open", String(open));
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

if (header && toggle && nav) {
  setOpen(false);

  toggle.addEventListener("click", () => {
    setOpen(header.getAttribute("data-nav-open") !== "true");
  });

  // Close after picking a section.
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.getAttribute("data-nav-open") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
}
