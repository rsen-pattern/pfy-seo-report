# pfy-seo-report

SEO report for **Pure Encapsulations** (`pureforyou.com`), built by Pattern.
A single, self-contained HTML dashboard deployed via Netlify.

## What's in the report

`index.html` is a sidebar-navigated dashboard. On load it reads **every data
value** — KPIs, gauges, chart series, table rows, insight cards, dates, status
pills — from a single **Google Sheet** (one tab per section) and renders KPI
tiles, [Chart.js](https://www.chartjs.org/) charts, and tables. Nothing is
hardcoded: an analyst edits a cell in the Sheet and the report reflects it on
the next page load — no git push, no Netlify build.

| Section | Status | Contents |
| --- | --- | --- |
| **Benchmark Data** | Live | KPIs + Organic Traffic, Keywords, Top Pages, Backlinks |
| **Tech Audit** | Live | KPIs + Core Web Vitals, Metadata, Crawlability, Inlinks, Images, Priority Issues |
| **Competitor Audit** | WIP | Competitive landscape (placeholder) |
| **WIP Notes** | WIP | Internal working notes (placeholder) |
| **Delivery** | WIP | Briefs and client deliverables (placeholder) |

## Structure

```
pfy-seo-report/
├── index.html         ← the report (no build step; reads from Google Sheets)
├── sheet_template.md  ← CSV blocks to scaffold the Google Sheet
├── data/              ← source exports (import keywords/pages/refdomains into the Sheet;
│                          PFY - CRAWLS.xlsx is the Tech Audit source)
├── assets/            ← images, logos
└── README.md          ← this file
```

## Data source: Google Sheets

The report pulls each tab as CSV via the `gviz/tq` endpoint:

```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={TAB_NAME}
```

### One-time setup

1. **Create the Sheet.** Open `sheet_template.md` and create one tab per
   section, named **exactly** as the heading (`report_meta`, `kpis_benchmark`,
   `traffic_trend`, `keywords`, `pages`, `refdomains`, `backlinks_summary`,
   `kpis_tech`, `cwv_gauges`, `tech_charts`, `dup_titles`, `canonicals`,
   `crawl_summary`, `inlinks_summary`, `priority_issues`, `insights`). Paste
   each CSV block into cell A1 of its tab.
   - For the three large tabs (**keywords**, **pages**, **refdomains**) use
     **File → Import → Upload** with `data/keywords.csv`, `data/pages.csv`,
     `data/refdomains.csv`. Their headers already match.
2. **Share it.** Share → General access → **Anyone with the link → Viewer**.
   (gviz won't return data otherwise.)
3. **Wire it up.** Copy the Sheet ID from its URL
   (`docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`) and paste it into
   the `SHEET_ID` constant at the top of the `<script>` block in `index.html`.
4. Commit and push `index.html` — Netlify redeploys with the live Sheet wired in.

If `SHEET_ID` is left as `__REPLACE_ME__`, the report shows a setup banner and
renders nothing else.

### Updating the report

Edit a cell in the Sheet and reload the page — that's it. Tab names and column
headers must stay exactly as scaffolded (the parser keys off header names).
Add/remove rows freely (e.g. more keywords, more insight cards).

> **Cache caveat:** Google serves gviz responses through a short cache, so
> edits typically appear within **~1–2 minutes**, not instantly.

### What is *not* in the Sheet

A few Tech Audit values come from the Screaming Frog crawl rather than Semrush
and live in the `tech_charts` / `cwv_gauges` / `priority_issues` tabs (still
Sheet-driven). Static descriptive chart sub-captions and section prose remain
in the HTML. The full backlink profile is summarised to totals in
`backlinks_summary` (the row-level export is too granular for a Sheet).

## Viewing locally

Serve over HTTP so `fetch()` works (and set `SHEET_ID` first):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

> Chart.js and the DM Sans / DM Serif fonts load from a CDN, so an internet
> connection is needed for charts and fonts to render.

## Deploying (Netlify)

Connected to Netlify via GitHub — every push to `main` auto-deploys.

- **Build command:** none
- **Publish directory:** root (`.`)

## Notes

- `index.html` carries `noindex, nofollow`.
- If one Sheet tab fails to load, the rest of the report still renders and a
  small warning appears in the sidebar footer.
- Sections marked **WIP** in the sidebar are placeholders awaiting data.
