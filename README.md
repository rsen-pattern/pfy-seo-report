# pfy-seo-report

SEO report for **Pure Encapsulations** (`pureforyou.com`), built by Pattern.
A single, self-contained HTML dashboard deployed via Netlify.

## What's in the report

`index.html` is a sidebar-navigated dashboard. Data is held in JS arrays at the
bottom of the file and rendered into KPI tiles, [Chart.js](https://www.chartjs.org/)
charts, and tables.

| Section | Status | Contents |
| --- | --- | --- |
| **Benchmark Data** | Live | KPIs + tabs for Organic Traffic, Keywords, Top Pages, Backlinks (Semrush, as at 1 Jun 2026) |
| **Tech Audit** | WIP | Crawl, Core Web Vitals, indexation (placeholder) |
| **Competitor Audit** | WIP | Competitive landscape (placeholder) |
| **WIP Notes** | WIP | Internal working notes (placeholder) |
| **Delivery** | WIP | Briefs and client deliverables (placeholder) |

## Structure

```
pfy-seo-report/
├── index.html     ← the report (open directly in a browser, no build step)
├── data/          ← raw data exports (xlsx, csv from Semrush / GA4 / Search Console)
├── assets/        ← images, logos, charts
└── README.md      ← this file
```

## Viewing locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

> Note: Chart.js and the DM Sans / DM Serif fonts load from a CDN, so an
> internet connection is needed for charts and fonts to render.

## Deploying (Netlify)

Connected to Netlify via GitHub — every push to `main` auto-deploys.

- **Build command:** none
- **Publish directory:** root (`.`)

## Updating the report

1. Drop the new data export into `data/` (e.g. `crawl.xlsx`, `semrush-export.csv`).
2. Ask Claude Code to update the relevant section, for example:

   ```bash
   claude "Update the benchmark KPIs and traffic trend from data/semrush-export.csv"
   claude "Build out the Tech Audit section from data/crawl.xlsx"
   claude "Fill in the Competitor Audit using data/competitors.csv"
   ```

   Most edits live in the `DATA` block near the bottom of `index.html` — update
   the `topKeywords`, `topPages`, `refDomains`, `organicTraffic`, etc. arrays and
   the KPI tiles, and the charts/tables re-render automatically.

3. Review the change, commit, and push — Netlify redeploys automatically.

## Notes

- All styling and data are inline in `index.html`; the only external
  dependencies are the Chart.js and Google Fonts CDNs.
- Sections marked **WIP** in the sidebar are placeholders awaiting data.
