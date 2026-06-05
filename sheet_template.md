# Google Sheet Template — `pfy-seo-report`

Create one tab per section below, named **exactly** as the heading. Paste the CSV block into cell A1 of that tab (Google Sheets auto-splits on paste, or use **Data → Split text to columns**). Then **File → Share → Publish to web** (entire document, CSV) and wire `PUBLISH_ID` + the `TAB_GIDS` map at the top of `index.html`'s `<script>` block — see the README's *Data source* section.

> The three large data tabs — **keywords**, **pages**, **refdomains** — are not inlined here. Create those tabs and import the matching file from `data/` via **File → Import → Upload** (`data/keywords.csv`, `data/pages.csv`, `data/refdomains.csv`). Their headers already match.

## report_meta

```csv
key,value
client_name,Pure Encapsulations
client_url,pureforyou.com
report_date,1 Jun 2026
generated_date,"June 2, 2026"
data_source,Semrush · Screaming Frog
benchmark_status_label,1 Jun 2026
benchmark_status_dot,teal
tech_status_label,Critical Issues Found
tech_status_dot,red
```

## kpis_benchmark

```csv
label,value,delta,delta_dir,sub,color
Organic Traffic,33.6K,↑ 7% MoM,up,US monthly visits,blue
Organic Keywords,"8,907",↑ 3% MoM,up,Ranking US keywords,purple
Traffic Value,$36.6K,↑ 4% MoM,up,Est. monthly CPC value,teal
Authority Score,38,→ Stable,flat,Semrush domain authority,navy
Referring Domains,880,→ Stable,flat,Unique linking domains,blue
Total Backlinks,4.6K,→ Stable,flat,All inbound links,chart2
Non-Branded Traffic,32.5K,↑ 7% MoM,up,97% of total organic,teal
Paid Traffic,12.5K,↓ Scaling back,down,vs 69K peak Jan 2025,purple
```

## traffic_trend

```csv
month,organic,paid
2024-05,2965,26431
2024-06,2840,23477
2024-07,3942,46101
2024-08,7512,30879
2024-09,9529,20742
2024-10,12698,22566
2024-11,11559,18653
2024-12,13728,58643
2025-01,14793,68833
2025-02,16521,69717
2025-03,18805,38323
2025-04,25503,11965
2025-05,15314,7446
2025-06,32531,5046
2025-07,23133,5108
2025-08,21668,417
2025-09,19455,7455
2025-10,16540,2680
2025-11,20738,746
2025-12,26277,9213
2026-01,29495,6410
2026-02,27314,6339
2026-03,29520,6607
2026-04,31468,12593
2026-05,33572,12543
```

## backlinks_summary

```csv
chart_id,label,value
types,Text,3583
types,Image,183
follow,Follow,3542
follow,Nofollow,1058
```

## kpis_tech

```csv
label,value,delta,delta_dir,sub,color
URLs Crawled,"1,659",Both subdomains,flat,All response types,blue
Indexable Pages,"1,501",90.5% of crawl,up,HTML pages: 756,teal
Avg Perf Score,11.3,99.2% score below 50,down,Lighthouse · 755 pages,red
Avg LCP,27.2s,Target: ≤2.5s,down,754/755 pages failing,red
Orphan URLs,"2,561",No inlinks at all,down,Unreachable by crawlers,amber
Missing Sitemap,211,Indexable but absent,down,From XML sitemap,amber
No H1 Tag,66.7%,504 pages,down,Missing primary heading,purple
No Title Tag,50.8%,384 pages,down,Missing meta title,purple
```

## cwv_gauges

```csv
label,value,status,target,detail
Avg Performance Score,11.3,poor,90+,749/755 pages fail
Avg LCP,27.2s,poor,≤2.5s,754/755 pages fail
Avg TBT,"1,655ms",poor,≤200ms,735/755 pages fail
Avg CLS,0.670,poor,≤0.1,610/755 pages fail
```

## tech_charts

```csv
chart_id,label,value,color
perf_score,0–9,480,red
perf_score,10–19,190,red
perf_score,20–29,55,red2
perf_score,30–39,15,amber
perf_score,40–49,9,amber
perf_score,50–89,6,teal
perf_score,90+,0,blue
lcp,Good ≤2.5s,0,teal
lcp,Needs Improvement,1,amber
lcp,Poor >4s,754,red
tbt,Good ≤200ms,0,teal
tbt,Needs Improvement,20,amber
tbt,Poor >600ms,735,red
cls,Good ≤0.1,122,teal
cls,Needs Improvement,22,amber
cls,Poor >0.25,610,red
crux,Pass,3,teal
crux,Fail,34,red
crux,No Data,718,gray
crux_lcp,Good,4,teal
crux_lcp,Needs Improvement,29,amber
crux_lcp,Poor,7,red
crux_lcp,No CrUX Data,715,gray
title_coverage,Has Title,372,blue
title_coverage,Missing Title,384,gray
desc_coverage,Has Description,335,purple
desc_coverage,Missing,421,gray
h1_coverage,Has H1,252,teal
h1_coverage,Missing H1,504,red
meta_summary,No H1,504,red
meta_summary,No Desc,421,red
meta_summary,No Title,384,red
meta_summary,Long Desc (>160),52,purple
meta_summary,Short Desc (<70),66,purple
meta_summary,Long Title (>60),43,blue
meta_summary,Short Title (<30),9,blue
status_codes,200 OK,1637,teal
status_codes,403 Forbidden,17,amber
status_codes,404 Not Found,3,red
status_codes,301 Redirect,2,blue
crawl_depth,Depth 0,1,teal
crawl_depth,Depth 1,52,blue
crawl_depth,Depth 2,283,purple
crawl_depth,Depth 3,180,purple
crawl_depth,Depth 4,13,gray
crawl_depth,Depth 5+,2,gray2
sitemap,In Sitemap,3206,teal
sitemap,Missing from Sitemap,211,amber
sitemap,Orphan URLs,2561,red
indexability,Indexable,1501,teal
indexability,Non-Indexable,163,gray
inlinks,0 inlinks,130,red
inlinks,1–4 inlinks,446,amber
inlinks,5–49 inlinks,159,blue
inlinks,50+ inlinks,21,teal
images,Has Alt Text,5176,teal
images,Missing Alt,16222,red
```

## dup_titles

```csv
title,count
Personalized Wellness Questionnaire | Pure Encapsulations,94
undefined | Glossary | Pure Encapsulations,6
Bones & Musculoskeletal Health | Pure Encapsulations,5
Mental Health & Stress Support | Pure Encapsulations,5
Multivitamins | Pure Encapsulations,5
Immune | Pure Encapsulations,4
Cardiovascular Health | Pure Encapsulations,4
Gut Health | Pure Encapsulations,4
Vitamins & Minerals | Pure Encapsulations,4
Energy & Fatigue | Pure Encapsulations,4
```

## canonicals

```csv
status,count,pct,action_label,action_pill
Self-referencing (correct),489,64.7%,Good,teal
Missing canonical tag,267,35.3%,Fix — add self-canonical,red
Points to another URL,0,0%,None,teal
```

## crawl_summary

```csv
area,finding,value,status,status_pill,priority
Response Codes,200 OK pages,"1,637",Good,teal,—
Response Codes,404 Broken URLs,3,Good,teal,Low
Response Codes,403 Forbidden,17,Monitor,amber,Medium
Redirects,301 Permanent,2,Good,teal,—
Redirects,Redirect Chains / Loops,0,Pass,teal,—
Sitemap,Indexable pages in sitemap,"3,206",Normal,blue,—
Sitemap,Indexable — NOT in sitemap,211,Fix,amber,High
Orphans,URLs with zero inlinks,"2,561",Critical,red,High
Depth,Max crawl depth,6 levels,Normal,blue,—
Depth,Pages at depth 2–3,463 pages,Good,teal,—
Architecture,Subdomains in crawl,2 (root + smartq),Monitor,amber,Medium
Architecture,smartq traffic concentration,85.2%,Risk,red,High
```

## inlinks_summary

```csv
key,value
zero_inlinks_count,130
zero_inlinks_pct,17.2
low_count,446
low_pct,59.0
medium_count,159
medium_pct,21.0
high_count,21
high_pct,2.8
avg_inlinks,20.3
max_inlinks,2202
```

## priority_issues

```csv
n,issue,volume,impact,effort,category
1,Avg LCP 27.2s — catastrophic page speed across all product pages,754/755 pages,HIGH,HIGH,Performance
2,"Avg TBT 1,655ms — excessive main thread blocking",735/755 pages,HIGH,HIGH,Performance
3,Avg CLS 0.670 — severe layout shift on load,610/755 pages,HIGH,MEDIUM,Performance
4,504 pages missing H1 tag (66.7%),504 pages,HIGH,LOW,Metadata
5,"2,561 orphan URLs — no internal links, unreachable by crawlers","2,561 URLs",HIGH,MEDIUM,Architecture
6,384 pages missing title tag (50.8%),384 pages,HIGH,LOW,Metadata
7,267 pages missing canonical tag (35.3%),267 pages,MEDIUM,LOW,Metadata
8,211 indexable pages missing from XML sitemap,211 pages,HIGH,LOW,Sitemap
9,"16,222 images missing alt text (75.8%)","16,222 images",MEDIUM,MEDIUM,Images
10,576 pages with 0–4 inlinks — poor internal link equity,576 pages,HIGH,MEDIUM,Inlinks
11,421 pages missing meta description (55.7%),421 pages,MEDIUM,LOW,Metadata
12,94 pages share same title tag (Questionnaire page),94 pages,HIGH,LOW,Metadata
13,85% organic traffic on subdomain — link equity dilution risk,smartq subdomain,HIGH,HIGH,Architecture
14,17 URLs returning 403 Forbidden,17 URLs,LOW,LOW,Crawlability
```

## insights

```csv
page,tab,icon,icon_color,heading,body
benchmark,organic,📈,blue,10× Growth in 24 Months,Organic traffic surged from ~3K/mo (May 2024) to 33.6K/mo by May 2026 — a 10-fold increase. The site is clearly in an accelerating growth phase driven by non-branded supplement keywords.
benchmark,organic,🔍,purple,97% Non-Branded Traffic,"The vast majority of organic visits come from generic supplement and ingredient searches, not brand terms. This signals strong topical authority and low brand-search dependency — healthy for long-term growth."
benchmark,organic,🎯,teal,Informational Intent Dominates (83%),"83% of ranking keywords are informational. A major opportunity exists to convert this educational audience through better commercial content, buying guides, and CTA optimisation on high-traffic informational pages."
benchmark,organic,📉,amber,Paid Scaling Back — Organic Must Fill the Gap,Paid traffic fell from a peak of ~69K visits (Jan 2025) to ~12.5K (May 2026). The paid reduction puts pressure on organic to compensate — making this SEO engagement strategically critical right now.
benchmark,pages,🌐,purple,Subdomain Concentration Risk,"85.2% of organic traffic and 8,066 keywords sit on <em>smartq.pureforyou.com</em> — treated as a separate entity by Google. This creates architectural risk and link equity dilution between root domain and subdomain."
benchmark,pages,🤖,blue,Early AI Search Presence,"Multiple top pages already appear in Gemini, SearchGPT, and Google AI Overviews. This early positioning is valuable — AI citations reinforce brand authority and drive zero-click brand awareness."
benchmark,backlinks,⚠️,amber,80% of Domains Score 0–10,"The backlink profile is dominated by low-authority sites — many are directories, blogspots, and aggregators. Quality link building targeting AS 40+ health, nutrition, and lifestyle publishers should be a core workstream."
benchmark,backlinks,✅,teal,Strong Editorial Links from Health Media,"Healthline, Men's Health, Medical News Today, Vogue, and The Good Trade have all linked to PFY product pages. This editorial foundation signals genuine brand authority and provides a base to build from."
benchmark,backlinks,🌏,blue,Singapore Cluster — Audit Recommended,33% of referring domains originate from Singapore IPs — predominantly low-quality directory and aggregator sites. These should be reviewed for disavow eligibility to protect link profile quality.
benchmark,backlinks,⚓,purple,Healthy Anchor Text Distribution,"Top anchors are ""consumer site"" (16%), brand URL (10%), ""take me to pure for you"" (7%). No over-optimised commercial anchors detected — this is a clean, natural profile with room to build strategic anchor diversity."
tech,tech-cwv,🚨,red,Critical: Avg LCP of 27 Seconds,"The average Largest Contentful Paint across 755 pages is 27.2 seconds — over 10× the ""Poor"" threshold of 4s and nearly 11× the ""Good"" threshold. This is the most severe technical issue on the site and almost certainly suppressing rankings across all product pages."
tech,tech-cwv,⚡,red,99.2% of Pages Score Below 50 on Lighthouse,"Only 6 pages out of 755 achieve a performance score of 50+, and zero pages reach the 90+ ""Good"" threshold. This is a systemic infrastructure or rendering issue, not an isolated problem — likely related to the Shopify headless/smartq setup."
tech,tech-cwv,🔄,amber,CLS of 0.67 — Severe Layout Instability,"An average CLS of 0.670 means page elements shift significantly during load — a very poor user experience. The ""Good"" threshold is 0.1. 610 pages fail. Likely caused by late-loading images without reserved dimensions or dynamic content injection."
tech,tech-cwv,📊,blue,CrUX Field Data Confirms Lab Data Issues,"Real-user CrUX data shows only 3 pages passing Core Web Vitals, 34 failing, with CrUX LCP categorised as ""Poor"" on 7 pages and ""Needs Improvement"" on 29. Lab and field data are aligned — this is a real user impact, not just a testing artifact."
tech,tech-meta,🏷️,red,50.8% Missing Title Tags — 384 Pages,The most impactful on-page SEO element is absent on over half the site. This is predominantly pagination pages and newer products on the smartq subdomain. Shopify's liquid templates should output titles by default — this suggests a custom theme gap or missing product data.
tech,tech-meta,📌,amber,66.7% Missing H1 — 504 Pages,"H1 is Google's primary signal for page topic. 504 pages have no H1 whatsoever — the most urgent metadata fix. Priority should be product pages with existing organic rankings, as adding H1s to ranked pages has high potential for quick position improvement."
tech,tech-meta,🔁,purple,94 Pages Share Same Title Tag,"The ""Personalized Wellness Questionnaire"" title appears on 94 pages — the biggest duplicate cluster. Pagination pages are also cannibalising collection titles. Unique, keyword-optimised titles are needed across all paginated URLs."
tech,tech-meta,📋,blue,267 Pages Need Self-Canonical Tags,35.3% of indexable HTML pages have no canonical tag at all. Adding self-referencing canonicals to these pages prevents potential duplicate content signals and consolidates ranking signals — a quick technical win.
tech,tech-crawl,🗺️,red,"2,561 Orphan URLs — Crawl Dead Zones","Over 2,500 URLs have zero internal links pointing to them. These pages are invisible to users and largely to Googlebot without sitemap inclusion. Many are product and glossary pages on the smartq subdomain that need to be integrated into the site's internal linking architecture."
tech,tech-crawl,🏗️,amber,Subdomain Architecture — Structural Risk,The smartq.pureforyou.com subdomain carries 85% of traffic but operates as a Google-separate entity. Link equity from pureencapsulations.com (domain authority 60) to pureforyou.com does not flow to smartq. Consolidation to a subdirectory (/products/) should be evaluated as a long-term strategic priority.
tech,tech-inlinks,🔗,red,76.2% of Pages Have Fewer Than 5 Inlinks,"576 pages (130 + 446) have 0–4 internal links pointing to them. This severely limits internal PageRank flow to product and category pages. A structured internal linking strategy — hub pages, category navigation, related products — is needed urgently."
tech,tech-inlinks,🏠,blue,Homepage Receives Disproportionate Internal Links,"With 2,202 inlinks, the homepage receives far more internal link equity than any other page. Link equity is not being distributed to revenue-driving product pages — an internal linking audit and restructure is recommended to push authority to commercial pages."
tech,tech-inlinks,📦,amber,Only 21 Pages Have 50+ Inlinks,"2.8% of pages receive meaningful internal link support. Top-performing organic pages need deliberate internal link building from relevant blog posts, category pages, and cross-links — especially the magnesium glycinate, multivitamin, and prenatal product pages."
tech,tech-inlinks,💡,teal,Quick Win: Add Internal Links from Glossary,"The smartq subdomain has a glossary section with significant crawl volume. Adding contextual internal links from glossary terms (e.g. ""magnesium glycinate"") directly to product pages is a low-effort, high-impact internal linking opportunity."
tech,tech-images,🖼️,red,"75.8% of Images Have No Alt Text — 16,222 Images","This is both an accessibility failure and a significant missed SEO opportunity. Alt text helps Google understand images, enables image search rankings, and is required for WCAG AA compliance. With 21,398 images on the site, manual fixes are not feasible — a template-level solution is needed."
tech,tech-images,🛒,blue,Product Images Are a Ranking Opportunity,"Pure Encapsulations has hundreds of supplement products with high-intent image searches (e.g. ""magnesium glycinate 120 capsules""). Implementing structured alt text with product name, format, and key ingredient can open Google Image Search as a meaningful additional traffic channel."
tech,tech-images,⚙️,teal,Shopify Template Fix — High Leverage,Recommend implementing alt text generation in Shopify liquid templates using <code>{{ product.title }} | {{ product.type }} | Pure Encapsulations</code> format. This would fix alt text site-wide without manual intervention and is a one-time development task.
tech,tech-images,📏,amber,Image Size Optimisation — Verify,"The 2XU audit pattern flagged image size as a key performance lever. Given the catastrophic LCP scores on PFY (avg 27.2s), oversized images are likely a major contributor. A targeted image compression and lazy-loading audit across the top 50 product pages is recommended as a first step."
```

## keywords / pages / refdomains

Import from `data/` (see note above). Required columns:

- **keywords**: `keyword, position, search_volume, traffic, traffic_pct, keyword_intents, serp_features`
- **pages**: `url, traffic_pct, traffic, keywords, traffic_change, top_keyword, answer_engines`
- **refdomains**: `domain, authority_score, backlinks, country, first_seen, last_seen`
