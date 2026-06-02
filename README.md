# pfy-seo-report

The PFY SEO report — a single, self-contained HTML page deployed via Netlify.

## Structure

```
pfy-seo-report/
├── index.html     ← the report (open directly in a browser, no build step)
├── data/          ← raw data exports (xlsx, csv from Semrush / GA4 / Search Console)
├── assets/        ← images, logos, charts
└── README.md      ← this file
```

## Viewing locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying (Netlify)

The site is connected to Netlify via GitHub. Every push to `main` auto-deploys.

- **Build command:** none
- **Publish directory:** root (`.`)

## Updating the report

1. Drop the new data export into `data/` (e.g. `crawl.xlsx`, `semrush-export.csv`).
2. Ask Claude Code to update the relevant section, for example:

   ```bash
   claude "Add the tech audit data from data/crawl.xlsx to the Tech Audit section"
   claude "Update the organic traffic benchmark with data/semrush-export.csv"
   claude "Build out the competitor section from data/competitors.csv"
   ```

3. Review the change, commit, and push — Netlify redeploys automatically.

## Notes

- `index.html` carries `noindex, nofollow` so the report is not indexed by search engines.
- All styling is inline in `index.html` — no dependencies, no build tooling.
- Sections currently marked `[TODO]` are placeholders waiting on real data.
