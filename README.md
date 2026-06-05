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

## Data source: a published Google Sheet

The report reads each tab as CSV from a **Publish‑to‑web** Google Sheet. Each
tab is fetched by its numeric `gid`:

```
https://docs.google.com/spreadsheets/d/e/{PUBLISH_ID}/pub?gid={GID}&single=true&output=csv
```

`PUBLISH_ID` is the public token in the published URL (`/d/e/<PUBLISH_ID>/pubhtml`) —
not the private file id — so it's safe to commit. The current report is wired to
the `pfy-seo-report-data` sheet.

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
2. **Publish it.** File → Share → **Publish to web** → Entire document → CSV.
3. **Wire it up** in the `<script>` block of `index.html`:
   - Set `PUBLISH_ID` to the token from the published URL.
   - Set `TAB_GIDS` (tab name → gid). Read the gids from the pubhtml source —
     each tab appears as `items.push({name:"…", pageUrl:"…gid=…"})`.
4. Commit and push `index.html` — Netlify redeploys with the live data wired in.

If `PUBLISH_ID` is left as `__REPLACE_ME__`, the report shows a setup banner and
renders nothing else.

### Updating the report

Edit a cell in the Sheet and reload the page — that's it. Column headers must
stay exactly as scaffolded (the parser keys off header names), and a tab's gid
must stay stable (recreating a tab changes its gid — update `TAB_GIDS` if so).
Add/remove rows freely (e.g. more keywords, more insight cards).

> **Cache caveat:** publish-to-web is served through Google's cache, so edits
> can take a few minutes to appear (longer than the live edit grid). The report
> appends a `&_=<timestamp>` cache-buster to dodge the *browser* cache, but the
> server-side publish cache still applies.

### What is *not* in the Sheet

A few Tech Audit values come from the Screaming Frog crawl rather than Semrush
and live in the `tech_charts` / `cwv_gauges` / `priority_issues` tabs (still
Sheet-driven). Static descriptive chart sub-captions and section prose remain
in the HTML. The full backlink profile is summarised to totals in
`backlinks_summary` (the row-level export is too granular for a Sheet).

## Viewing locally

Serve over HTTP so `fetch()` works (the published doc is already wired in, so
this shows live data):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

> Chart.js and the DM Sans / DM Serif fonts load from a CDN, so an internet
> connection is needed for charts and fonts to render.

## AI features (summary + chat)

Two AI features sit on top of **Pattern's Bi Frost LLM gateway**
(`bifrost.pattern.com`, OpenAI-compatible), each via its own Netlify function.
The API key lives **only on the server** (a Netlify environment variable) — it
is never shipped to the browser.

- **AI Executive Summary** — a card on the Benchmark page. *Generate summary*
  builds a compact digest of the loaded data (KPIs, Core Web Vitals, top
  priority issues) and returns a three-paragraph overview.
- **Ask AI (chat)** — a floating widget on every page. A multi-turn chat that
  answers questions about the report; the browser sends the conversation plus a
  richer context digest (the summary digest + top keywords and top pages), and
  the function relays it as a Chat Completions conversation.

```
browser → /.netlify/functions/ai-summary → Bi Frost (/v1/chat/completions) → summary
browser → /.netlify/functions/ai-chat    → Bi Frost (/v1/chat/completions) → reply
```

| Piece | File |
| --- | --- |
| Summary proxy | `netlify/functions/ai-summary.mjs` |
| Chat proxy (multi-turn) | `netlify/functions/ai-chat.mjs` |
| Shared Bi Frost plumbing | `netlify/functions/lib/bifrost.mjs` |
| Model catalogue + fallback chain | `config/models.json` |
| Netlify config (publish dir, functions) | `netlify.toml` |

Both functions share `lib/bifrost.mjs` (key handling, `/v1` normalisation, the
`config/models.json` fallback chain, and headers — key never logged). The shared
`callBifrost()` gives each model attempt a timeout bounded by an overall budget,
so a stalled provider fails fast and the handler always returns before Netlify's
function timeout. Both endpoints also enforce an **Origin allowlist** (the site's
own domains) to deter cross-site abuse of these public endpoints; the chat
additionally clamps the conversation (recent turns only, per-message and digest
length caps).

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
- **Required env var:** `BIFROST_API_KEY` (for the AI summary and chat)

## Notes

- `index.html` carries `noindex, nofollow`.
- If one Sheet tab fails to load, the rest of the report still renders and a
  small warning appears in the sidebar footer.
- Sections marked **WIP** in the sidebar are placeholders awaiting data.
