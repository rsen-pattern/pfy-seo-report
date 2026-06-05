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

## AI executive summary

The Benchmark page has an **AI Executive Summary** card. Clicking *Generate
summary* builds a compact digest of the loaded report data (KPIs, Core Web
Vitals, top priority issues) and sends it to a Netlify function, which calls
**Pattern's Bi Frost LLM gateway** (`bifrost.pattern.com`, OpenAI-compatible)
and streams back a three-paragraph summary.

The API key lives **only on the server** (a Netlify environment variable) — it
is never shipped to the browser.

```
browser → /.netlify/functions/ai-summary → Bi Frost (/v1/chat/completions) → summary
```

| Piece | File |
| --- | --- |
| Serverless proxy | `netlify/functions/ai-summary.mjs` |
| Model catalogue + fallback chain | `config/models.json` |
| Netlify config (publish dir, functions) | `netlify.toml` |

**Setup:** in the Netlify project, set an environment variable
**`BIFROST_API_KEY`** (the function also accepts `BIFROST_KEY`) to a Bi Frost
key. Optionally override `BIFROST_BASE_URL` (defaults to
`https://bifrost.pattern.com`; the function normalises it to end with `/v1`).

The function tries `config/models.json`'s `default_model`, then walks the
`fallback_chain` — which deliberately spans providers so an Anthropic-wide rate
limit cascades to OpenAI. The response notes which model actually answered. To
add or swap a model, edit `config/models.json` — no code change.

> The summary needs the deployed Netlify function. It won't work from `file://`
> or a plain `python3 -m http.server` (there's no function locally) — the card
> shows a friendly notice in that case. Use `netlify dev` to exercise it
> locally with the env var set.

## Deploying (Netlify)

Connected to Netlify via GitHub — every push to `main` auto-deploys.

- **Build command:** none
- **Publish directory:** root (`.`) — pinned in `netlify.toml`
- **Functions directory:** `netlify/functions` (bundled with esbuild)
- **Required env var:** `BIFROST_API_KEY` (for the AI summary)

## Notes

- `index.html` carries `noindex, nofollow`.
- If one Sheet tab fails to load, the rest of the report still renders and a
  small warning appears in the sidebar footer.
- Sections marked **WIP** in the sidebar are placeholders awaiting data.
