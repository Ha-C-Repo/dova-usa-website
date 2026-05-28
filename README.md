# dova-usa-website

Static website for **D.O.V.A., LLC** (Digital Orchestration of Vehicle Authorization).
Deployed via GitHub Pages, served at `https://dovausa.com`.

## Stack

- Hand-written HTML, CSS, vanilla JS. No build pipeline.
- Three.js (CDN, importmap) for the homepage hero scene.
- GSAP 3.12 + ScrollTrigger + Lenis (CDN) for scroll-driven animation.
- Fonts: Syne (display) + DM Sans (body), Google Fonts.
- Brand tokens live as CSS custom properties at the top of `assets/css/styles.css`.

## Pages

| URL | Source |
|-----|--------|
| `/` | `index.html` |
| `/how-it-works/` | `how-it-works/index.html` |
| `/product/` | `product/index.html` |
| `/features/` | `features/index.html` |
| `/solutions/` | `solutions/index.html` |
| `/solutions/dealerships/` | `solutions/dealerships/index.html` (display: "For Automotive Retail") |
| `/solutions/fleet/` | `solutions/fleet/index.html` |
| `/post-sale/` | `post-sale/index.html` |
| `/roi/` | `roi/index.html` (calculator) |
| `/contact/` | `contact/index.html` (Formspree) |
| `/cost-savings/` | redirect to `/roi/` |
| `/404.html` | error page |

## Assets

```
assets/
  css/styles.css            single stylesheet, brand tokens at top
  js/main.js                mobile nav, ROI calculator, form fallback
  js/hero-scene.js          Three.js scene (pending merge from prototype-v2)
  images/
    dova-hero-frame-1.{png,webp,avif}     hero fallback frames
    dova-hero-frame-2.{png,webp,avif}
    dova_*.svg                            brand marks (announcement, footer, inline, shield)
    favicon.svg
    og/og-default.{png,webp}              social-share image (1200x630)
  downloads/
    DOVA_How_It_Works.pdf
    DOVA_Post_Sale_Options.pdf
```

## Brand

- Navy: `#07192E`
- Navy 2: `#0D2540`
- Blue: `#1A7FE8`
- Blue 2: `#1468C5`
- Cyan: `#00AACC`
- Background: `#F4F8FC`
- Fonts: Syne (display), DM Sans (body)

All brand tokens are CSS custom properties on `:root` in `assets/css/styles.css`.

## Voice and disclosure rules

This site follows the DOVA voice firewall and the IP disclosure boundary:

- No em-dashes anywhere. Use periods or hyphens.
- No banned vocabulary (leverage, synergy, empower, game-changing, deep dive, etc.).
- No claim text, no FTO findings, no internal patent numbers.
- No "Nano Cube" or "Pinnacle" references.
- The "Patent Pending" label and the meta description mention of "Patent Pending" are pre-approved.

Before committing, run:

```
bash scripts/build-checks.sh
```

This runs three filters: em-dash, banned vocabulary, disclosure. Exit code non-zero on any failure. Gate any push behind it.

## SEO

Every page has:

- `<title>` and `<meta name="description">`
- `<link rel="canonical">`
- Open Graph (`og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, `og:site_name`)
- Twitter card (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

`index.html` additionally carries Organization JSON-LD.

Root-level files:
- `sitemap.xml` (10 URLs)
- `robots.txt` (allow all, disallow `/prototype/`, `/prototype-v2/`, `/cost-savings/`)
- `CNAME` (dovausa.com)

## Accessibility

- Skip link on every page (target `#main`).
- `:focus-visible` outlines on all interactive elements.
- `prefers-reduced-motion` respected by the hero scene (when merged).
- Hero canvas uses `aria-hidden` plus static `<picture>` fallback.

## Deploy

GitHub Pages, branch `main`, root deploy. CNAME points at `dovausa.com`.

```
git add -A
git commit -m "..."
git push
```

Rollback: `git revert <sha>` and push. Recovery under 5 minutes.

## Phase 4 status (per blueprint DOVA-2026-PROD-001)

- [x] 4a Image optimization (PNG to WebP+AVIF)
- [x] 4b sitemap.xml, robots.txt
- [x] 4c Canonical, OG, Twitter, JSON-LD
- [x] 4d Formspree wired on contact form
- [x] 4e Skip link, focus-visible, ARIA pass
- [x] 4f cost-savings stub redirect
- [x] 4g README rewrite
- [ ] 4h Merge prototype-v2 hero scene into index.html
- [ ] 4i MIT primitives drop-in (Magic UI / Aceternity / Origin)
- [ ] 4j Lighthouse measurement and regression fixes
- [x] 4k Voice plus disclosure filter script (`scripts/build-checks.sh`)
- [ ] 4l Optional: Cloudflare Pages migration (reserved)
