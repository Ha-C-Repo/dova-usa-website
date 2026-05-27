# dova-usa-website

Static website for **D.O.V.A., LLC** — Digital Orchestration of Vehicle Authorization.
Deployed via GitHub Pages, served at `https://dovausa.com`.

## Pages

| URL | Source |
|-----|--------|
| `/` | `index.html` |
| `/how-it-works/` | `how-it-works/index.html` |
| `/product/` | `product/index.html` |
| `/features/` | `features/index.html` |
| `/solutions/` | `solutions/index.html` |
| `/solutions/dealerships/` | `solutions/dealerships/index.html` |
| `/solutions/fleet/` | `solutions/fleet/index.html` |
| `/post-sale/` | `post-sale/index.html` |
| `/roi/` | `roi/index.html` |
| `/contact/` | `contact/index.html` |
| 404 | `404.html` |

## Assets

```
assets/
  css/styles.css          -- single stylesheet, brand tokens at top
  js/main.js              -- mobile nav, ROI calculator, form handler
  images/                 -- SVG badges (announcement bar, footer, inline, shield)
  downloads/              -- PDF one-pagers (How It Works, Post-Sale Options)
```

## Brand

- Navy: `#0B1F3D`
- Accent blue: `#2E6FDB`
- Inter (headings), DM Sans (body) from Google Fonts CDN
- All brand tokens live as CSS custom properties at the top of `styles.css`

## Deploy

- `CNAME` points `dovausa.com` at GitHub Pages
- `.nojekyll` disables Jekyll processing (so folders starting with `_` are served as-is)
- Push to `main` branch; GitHub Pages serves from `main` root

## Forms

`/contact/` uses a standard HTML form. The form `action` is empty by default and will
show a fallback message instructing the visitor to email `matthew@dovausa.com` directly.

To enable form submissions:
1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form, pointed at `matthew@dovausa.com`
3. Set the form `action` in `contact/index.html` to your Formspree endpoint URL

## ROI calculator

Live calculator at `/roi/`. Formula:
```
monthly_savings = team_size * vehicles_per_person_per_day * 18 minutes / 60
                  * 22 working days * hourly_rate
```

## Voice note

This site publishes content per Matthew's content guide (May 27, 2026) with voice rules
waived per the constitution amendment dated 2026-05-27 (see `.specify/constitution.md`
in the parent DOVA workspace). The waiver is scoped to this artifact only.

---
&copy; D.O.V.A., LLC 2026. Patent Pending. San Antonio, Texas.
