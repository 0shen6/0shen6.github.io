# Ömer Şen · Portfolio

Personal portfolio site for Ömer Şen ([@0shen6](https://github.com/0shen6)), a
2nd-year Computer Science student at Bilkent University.

It is a static site with no dependencies and no build step: plain HTML5, modern
CSS and vanilla ES modules. The look is dark-first "terminal/pixel" with a
light theme toggle.

```
site/
  index.html            home page: about, projects, hive, skills, contact
  projects/flagd.html   Flagd case study (handwritten)
  404.html
  data/site.json        all home-page content (single source of truth)
  css/                  tokens.css, base.css, components.css
  js/                   main.js, data.js, theme.js, nav.js, render/*.js
  assets/               favicon.svg, og-image.svg, og-image.png (social card)
tools/check_site.py     static checker (links, anchors, meta, site.json)
tools/make_og_image.py  regenerates assets/og-image.png (stdlib only)
.github/workflows/pages.yml
```

Every home-page section ships with static fallback content, so the page stays
readable if JavaScript or `site.json` fails to load.

## Local preview

ES modules don't load from `file://`, so serve the folder over HTTP:

```sh
python -m http.server -d site 8000
```

Then open <http://localhost:8000>.

## Editing content

Almost everything on the home page comes from **`site/data/site.json`**:

| Key        | What it controls                                                       |
|------------|------------------------------------------------------------------------|
| `profile`  | name, handle, tagline, bio, university, degree, year, avatar URL       |
| `links`    | contact links (`label`, `url`, `icon`); only real links, please        |
| `skills`   | skill groups: `{ "group": "...", "items": ["..."] }`                   |
| `projects` | cards: `slug`, `title`, `summary`, `description`, `tech[]`, `repo`, optional `page`, `featured`, `highlights[]` |
| `hive`     | `summary`, `role`, `contributions[]` (`title`, `description`, optional `url`) |
| `updated`  | last-updated date                                                      |

Notes:

- Hive contributions whose `note` starts with `TODO` are placeholders and are
  **not shown** on the page. Replace them with real entries and delete the `note`.
- Set `featured: true` on one project to give it the large, full-width card.
- A project `page` (for example `projects/flagd.html`) adds a "Read more" link.
  Case-study pages are handwritten HTML; copy `projects/flagd.html` as a template.
- The static fallback text in `index.html` and the Flagd page itself are edited
  by hand.

After editing, run the checker:

```sh
python tools/check_site.py
```

It validates `site.json`, checks that every internal `href`/`src` and `#anchor`
resolves, and checks each page for `lang`, `<title>`, meta description and
viewport, image `alt`, and heading order. It exits non-zero on any problem.

## Deploying to GitHub Pages

The site is published at **<https://0shen6.github.io/>**, a GitHub *user site*
served from the domain root. A user site needs a repository named exactly
`0shen6.github.io`. The Pages workflow publishes the contents of `site/` as
that site's root, so `site/index.html` becomes `https://0shen6.github.io/`.

### Option A: GitHub Actions (recommended)

`.github/workflows/pages.yml` runs the checker and publishes the `site/` folder
on every push to `main` that touches the site.

1. Push the repository to GitHub as `0shen6/0shen6.github.io`.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main`, or run the workflow manually from the **Actions** tab.

### Option B: deploy from `docs/`

If you'd rather not use Actions, Pages can serve a `/docs` folder from a branch:

1. Copy or rename `site/` to `docs/` (and update the paths in the README and checker).
2. Go to **Settings → Pages → Source: Deploy from a branch**, then pick `main` / `/docs`.

### Hosting notes

- All internal links are relative, so the site works both at a domain root
  (`<user>.github.io`) and under a project path (`<user>.github.io/<repo>/`).
  The one exception is `404.html`. GitHub serves it for any missing URL,
  including nested ones like `/foo/bar`, where relative paths don't resolve. So
  it is self-contained: its CSS, favicon, logo and theme toggle are inlined.
  Its home links (marked `data-root-link`) are retargeted by a small script.
  On a `*.github.io` host the root is guessed to be the first path segment (the
  repo on project Pages), otherwise `/`. The guess is then confirmed by probing
  `<root>/data/site.json`, falling back to the other candidate, which covers a
  nested miss on a user site. Without JavaScript the links keep their relative
  `index.html` href. `tools/check_site.py` fails if `404.html` gains any other
  relative `href`/`src`. If you change the design tokens or header, update the
  inline `<style>` in `404.html` too.
- Canonical and social-card URLs are absolute: each page has
  `<link rel="canonical">` and `og:url` set to its own address under
  `https://0shen6.github.io/`, and `og:image` / `twitter:image` point at
  `https://0shen6.github.io/assets/og-image.png`. `404.html` stays `noindex`
  with no canonical. `tools/check_site.py` checks that `og:url` and canonical
  use this base and match the page, and that absolute URLs on this host
  resolve to files in `site/`. If the address changes, update those tags and
  `SITE_URL` in the checker.
- The social card is a PNG because many platforms don't render SVG previews.
  `assets/og-image.svg` is the editable design. After changing it, mirror the
  change in `tools/make_og_image.py` and run `python tools/make_og_image.py`.

### Alternative: project Pages

The site also works as a *project* site at `https://0shen6.github.io/<repo>/`
from a repository with any other name. Internal links are relative, and
`404.html` detects the repo prefix. Only the absolute canonical/`og:url`/image
URLs would need the `/<repo>/` prefix, along with `SITE_URL` in
`tools/check_site.py`.
