#!/usr/bin/env python3
"""Static checks for the portfolio site. Python 3 stdlib only.

Run from the repo root:  python tools/check_site.py
Exits 1 if any check fails.

Checks:
  - site/data/site.json parses and has the required keys/shapes
  - project "page" entries in site.json point at existing files
  - every internal href/src in site/**/*.html resolves to a file,
    and every #anchor exists in the target page
  - every page has <html lang>, <title>, meta description and viewport
  - every <img> has an alt attribute, each page has exactly one <h1>,
    and heading levels never skip (h2 -> h4)
  - 404.html, which GitHub Pages serves at any depth, has no relative
    href/src except links marked data-root-link (retargeted by its script)
  - og:url and rel=canonical, when present, are the page's own absolute URL
    under SITE_URL; 404.html has neither. Absolute URLs under SITE_URL
    (og:image etc.) must resolve to files in site/.
"""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DATA = SITE / "data" / "site.json"
SITE_URL = "https://0shen6.github.io/"  # where site/ is deployed (GitHub user site)

errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


# ---------------------------------------------------------------- site.json

def require(obj, keys, where):
    if not isinstance(obj, dict):
        fail(f"site.json: {where} must be an object")
        return False
    ok = True
    for key in keys:
        if key not in obj:
            fail(f"site.json: missing {where}.{key}")
            ok = False
    return ok


def check_data() -> None:
    try:
        data = json.loads(DATA.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"{rel(DATA)} not found")
        return
    except json.JSONDecodeError as exc:
        fail(f"{rel(DATA)} does not parse: {exc}")
        return

    if not require(data, ["profile", "links", "skills", "projects", "hive", "updated"], "root"):
        return

    require(
        data["profile"],
        ["name", "handle", "tagline", "bio", "university", "degree", "year", "avatar"],
        "profile",
    )

    for name in ("links", "skills", "projects"):
        if not isinstance(data[name], list):
            fail(f"site.json: {name} must be an array")
            data[name] = []

    for i, link in enumerate(data["links"]):
        require(link, ["label", "url", "icon"], f"links[{i}]")

    for i, group in enumerate(data["skills"]):
        if require(group, ["group", "items"], f"skills[{i}]") and not isinstance(group["items"], list):
            fail(f"site.json: skills[{i}].items must be an array")

    for i, project in enumerate(data["projects"]):
        where = f"projects[{i}]"
        if not require(
            project,
            ["slug", "title", "summary", "description", "tech", "repo", "featured", "highlights"],
            where,
        ):
            continue
        page = project.get("page")
        if page and not (SITE / page).is_file():
            fail(f"site.json: {where}.page '{page}' does not exist under site/")

    if require(data["hive"], ["summary", "role", "contributions"], "hive"):
        if not isinstance(data["hive"]["contributions"], list):
            fail("site.json: hive.contributions must be an array")


# ---------------------------------------------------------------- HTML

class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.has_title = False
        self.metas: dict[str, str] = {}
        self.canonical: tuple[str, int] | None = None  # (href, line)
        self.ids: set[str] = set()
        self.refs: list[tuple[str, str, int]] = []  # (attr, url, line)
        self.unrooted: set[int] = set()              # indexes into refs lacking data-root-link
        self.headings: list[tuple[int, int]] = []    # (level, line)
        self.imgs_without_alt: list[int] = []
        self._in_title = False
        self._title_text = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.metas[key.lower()] = a.get("content") or ""
                if key.lower() in ("og:image", "twitter:image", "og:url") and a.get("content"):
                    self.refs.append((key, a["content"], line))
        if tag == "link" and "canonical" in (a.get("rel") or "").lower().split():
            self.canonical = (a.get("href") or "", line)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag in ("a", "link", "area") and a.get("href") is not None:
            self.refs.append(("href", a["href"], line))
            if "data-root-link" not in a:
                self.unrooted.add(len(self.refs) - 1)
        if tag in ("img", "script", "source", "iframe") and a.get("src") is not None:
            self.refs.append(("src", a["src"], line))
            self.unrooted.add(len(self.refs) - 1)
        if tag == "img" and "alt" not in a:
            self.imgs_without_alt.append(line)
        if len(tag) == 2 and tag[0] == "h" and tag[1] in "123456":
            self.headings.append((int(tag[1]), line))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
            self.has_title = bool(self._title_text.strip())

    def handle_data(self, data):
        if self._in_title:
            self._title_text += data


def parse(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def is_external(url: str) -> bool:
    parts = urlsplit(url)
    return bool(parts.scheme) or url.startswith("//")


def check_pages() -> int:
    pages = sorted(SITE.rglob("*.html"))
    parsed = {p.resolve(): parse(p) for p in pages}

    for page, info in parsed.items():
        name = rel(page)

        if not info.lang:
            fail(f"{name}: <html> is missing lang")
        if not info.has_title:
            fail(f"{name}: missing or empty <title>")
        if not info.metas.get("description"):
            fail(f"{name}: missing meta description")
        if "viewport" not in info.metas:
            fail(f"{name}: missing meta viewport")

        for line in info.imgs_without_alt:
            fail(f"{name}:{line}: <img> without alt")

        h1s = [h for h in info.headings if h[0] == 1]
        if len(h1s) != 1:
            fail(f"{name}: expected exactly one <h1> in static markup, found {len(h1s)}")
        prev = 0
        for level, line in info.headings:
            if prev and level > prev + 1:
                fail(f"{name}:{line}: heading jumps from h{prev} to h{level}")
            prev = level

        is_404 = page == (SITE / "404.html").resolve()

        # The page's own public URL: site/index.html -> SITE_URL, a/b.html -> SITE_URL + a/b.html.
        page_path = page.relative_to(SITE.resolve()).as_posix()
        own_url = SITE_URL + ("" if page_path == "index.html" else page_path)
        self_urls = [("og:url", info.metas.get("og:url"), None)]
        if info.canonical:
            self_urls.append(("rel=canonical", info.canonical[0], info.canonical[1]))
        for label, url, line in self_urls:
            if url is None:
                continue
            where = f"{name}:{line}" if line else name
            if is_404:
                fail(f"{where}: 404.html must not have {label} (it is served for any missing URL)")
            elif not url.startswith(SITE_URL):
                fail(f"{where}: {label} '{url}' must start with {SITE_URL}")
            elif url != own_url:
                fail(f"{where}: {label} '{url}' should be this page's own URL, {own_url}")

        for i, (attr, url, line) in enumerate(info.refs):
            if not url:
                continue
            on_site = url.startswith(SITE_URL)
            if is_external(url) and not on_site:
                continue
            if is_404 and i in info.unrooted and not on_site and not url.startswith("#"):
                fail(f"{name}:{line}: {attr}='{url}' is relative; 404.html is served at any "
                     "depth, so inline it or mark the link data-root-link")
                continue
            parts = urlsplit(url)
            fragment = unquote(parts.fragment)
            if on_site:
                # Absolute URL on our own host: check it against the deployed tree.
                target = (SITE / unquote(url[len(SITE_URL):].split("#")[0].split("?")[0])).resolve()
                if target.is_dir():
                    target = target / "index.html"
                if not target.is_file():
                    fail(f"{name}:{line}: {attr}='{url}' does not match a file under site/")
                    continue
            elif parts.path:
                target = (page.parent / unquote(parts.path)).resolve()
                if target.is_dir():
                    target = target / "index.html"
                if not target.is_file():
                    fail(f"{name}:{line}: {attr}='{url}' does not resolve to a file")
                    continue
                if SITE.resolve() not in target.parents:
                    fail(f"{name}:{line}: {attr}='{url}' points outside site/")
                    continue
            else:
                target = page
            if fragment:
                target_info = parsed.get(target)
                if target_info is None:
                    fail(f"{name}:{line}: '{url}' has an anchor on a non-HTML target")
                elif fragment not in target_info.ids:
                    fail(f"{name}:{line}: anchor '#{fragment}' not found in {rel(target)}")

    return len(pages)


def main() -> int:
    if not SITE.is_dir():
        print(f"FAIL: {rel(SITE)} not found")
        return 1

    check_data()
    count = check_pages()

    if errors:
        for msg in errors:
            print(f"FAIL: {msg}")
        print(f"\n{len(errors)} problem(s) found in {count} page(s) + site.json.")
        return 1

    print(f"OK: site.json valid; {count} page(s) checked (links, anchors, meta, headings, alt).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
