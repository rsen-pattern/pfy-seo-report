# pfy-seo-report

SEO report for **Pure Encapsulations** (`pureforyou.com`), built by Pattern.
A single, self-contained HTML dashboard deployed via Netlify.

## What's in the report

`index.html` is a sidebar-navigated dashboard. On load it `fetch()`es the CSV
files in `data/` and renders them into KPI tiles, [Chart.js](https://www.chartjs.org/)
charts, and tables. The Benchmark page is fully data-driven; the Tech Audit
charts are derived from the Screaming Frog crawl and currently hardcoded.

| Section | Status | Contents |
| --- | --- | --- |
| **Benchmark Data** | Live | KPIs + tabs for Organic Traffic, Keywords, Top Pages, Backlinks (Semrush, as at 1 Jun 2026) |
| **Tech Audit** | Live | KPIs + tabs for Core Web Vitals, Metadata, Crawlability, Inlinks, Images, and a Priority Issues register (Screaming Frog + PageSpeed Insights / CrUX) |
| **Competitor Audit** | WIP | Competitive landscape (placeholder) |
| **WIP Notes** | WIP | Internal working notes (placeholder) |
| **Delivery** | WIP | Briefs and client deliverables (placeholder) |

## Structure

```
pfy-seo-report/
├── index.html     ← the report (no build step; loads CSVs at runtime)
├── data/          ← data the report reads
│   ├── kpis.csv            ← benchmark KPI tiles (metric, current, MoM %)
│   ├── traffic_trend.csv   ← monthly organic/paid traffic trend
│   ├── keywords.csv        ← ranking keywords (drives table + intent/position charts)
│   ├── pages.csv           ← top organic pages
│   ├── refdomains.csv      ← referring domains (drives table + authority chart)
│   ├── backlinks.csv       ← backlinks export
│   └── PFY - CRAWLS.xlsx    ← Screaming Frog crawl (source for Tech Audit)
├── assets/        ← images, logos, charts
└── README.md      ← this file
```

## Viewing locally

Because the report fetches CSVs, it must be served over HTTP — opening
`index.html` directly via `file://` will trip the "Data files not found"
banner. Serve the folder from the repo root:

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

For the **Benchmark** page, just replace the relevant CSV in `data/` with a
fresh export (keep the same column headers) and push — no code change needed.
The KPI tiles, tables, intent/position/authority charts and badge counts all
recompute from the CSVs on load.

Expected CSV columns:

| File | Key columns |
| --- | --- |
| `kpis.csv` | `metric, current_may26, pct_change_mom` (rows: Organic Traffic, Organic Keywords, Organic Traffic Cost, Paid Traffic) |
| `traffic_trend.csv` | `month, Organic Traffic, Paid Traffic` |
| `keywords.csv` | `keyword, position, search_volume, traffic, traffic_pct, keyword_intents, serp_features` |
| `pages.csv` | `url, traffic_pct, traffic, keywords, traffic_change, top_keyword, answer_engines` |
| `refdomains.csv` | `domain, authority_score, backlinks, country, first_seen, last_seen` |
| `backlinks.csv` | `nofollow` (others optional) |

A few values are still hardcoded in `index.html` (Tech Audit charts, the
backlink type / follow-vs-nofollow totals, and the narrative insight cards).
Update those in the markup when the underlying data changes.

For the **Tech Audit** page, refresh `data/PFY - CRAWLS.xlsx` and update the
corresponding chart values in `index.html`.

Then review, commit, and push — Netlify redeploys automatically.

## Notes

- The report reads CSVs at runtime, so it must be served over HTTP (locally or
  on Netlify), not opened via `file://`.
- Chart.js and Google Fonts load from a CDN.
- Sections marked **WIP** in the sidebar are placeholders awaiting data.
