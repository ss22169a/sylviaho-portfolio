# sylviaho-portfolio

Personal portfolio of Sylvia Ho — Market & Marketing Analyst (semiconductors · automotive · e-commerce).
Static HTML + CSS, no build step. The visual system is adapted from the Posts dashboard design (Base44).

## Pages
| File | Page |
|---|---|
| `index.html` | Overview: hero, impact numbers, featured case studies, How I Use AI, career path |
| `work.html` | Case studies (question → data → insight → decision → impact) |
| `projects.html` | Analytics projects on public data |
| `about.html` | About, How I Work, toolkit, certifications |
| `resume.html` | Online résumé (links to `resume.pdf`) |

`style.css` holds every style; colors live in `:root` at the top.

## Motion (`js/`)
- `js/posts.js` — scroll reveal (rows, cards and panels fade up in sequence) and the hero physics: shapes fall in, stack, and get pushed around by the mouse.
- `js/matter.min.js` — Matter.js 0.19.0 physics engine (MIT), bundled so nothing loads from a CDN.
- Visitors with "reduce motion" turned on get the still version. Without JavaScript every page still shows in full.

## To fill in
- **Dashboards:** every "Dashboard coming soon" block is a placeholder. Replace the `<div class="placeholder">…</div>` with a Looker Studio embed, e.g.
  `<iframe src="https://lookerstudio.google.com/embed/reporting/…" width="100%" height="450" frameborder="0" allowfullscreen></iframe>`
- **`resume.pdf`:** add the PDF to the repo root (the Download button links to it).
- **Case 2 (hydrogen sensing):** add validation results once available.

## Deploy to GitHub Pages
Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
To use the custom domain, add `sylviaho.co` under Pages → Custom domain.
