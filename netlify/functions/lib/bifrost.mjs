// Shared Bi Frost helpers for the Netlify AI functions (summary + chat).
// Bi Frost is Pattern's OpenAI-compatible LLM gateway. The API key lives only
// in the Netlify environment and is read here at call time — never logged.
import { readFileSync } from 'node:fs';

export const DEFAULT_MODELS = {
  default_model: 'anthropic/claude-sonnet-4-6',
  fallback_chain: ['anthropic/claude-sonnet-4-6', 'anthropic/claude-haiku-4-5', 'openai/gpt-4.1'],
};

// config/models.json is the catalogue / fallback chain. Resolve it whether this
// module runs bundled (esbuild rewrites import.meta.url to the function bundle)
// or raw from source; fall back to the inline default if it can't be read.
export function loadModels() {
  for (const rel of ['../../config/models.json', '../../../config/models.json']) {
    try { return JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8')); } catch { /* try next */ }
  }
  try { return JSON.parse(readFileSync('config/models.json', 'utf8')); } catch { /* fall through */ }
  return DEFAULT_MODELS;
}

// Accept either name — older Pattern tools use the shorter BIFROST_KEY.
export function getApiKey() {
  return process.env.BIFROST_API_KEY || process.env.BIFROST_KEY || '';
}

// Names only (never values) — used to diagnose a missing/misnamed env var.
export function seenBifrostEnvNames() {
  return Object.keys(process.env).filter(k => /bifrost|bi.?frost/i.test(k));
}

function normalizeBaseUrl(url) {
  const base = (url || 'https://bifrost.pattern.com').replace(/\/+$/, '');
  return base.endsWith('/v1') ? base : base + '/v1';
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export const reply = (statusCode, obj) => ({ statusCode, headers: JSON_HEADERS, body: JSON.stringify(obj) });

// Origin allowlist: deters browser-based cross-site abuse of these public
// endpoints. Not a substitute for auth (a non-browser client can omit Origin),
// but it stops other websites calling them from a user's browser.
// Matches prod (pure-pfy-report.netlify.app), custom subdomains (.…), and
// Netlify branch/preview hosts (deploy-preview-N--pure-pfy-report.netlify.app).
const ALLOWED_HOST_RE = /(^|\.|--)pure-pfy-report\.netlify\.app$|^localhost$|^127\.0\.0\.1$/i;
export function originAllowed(event) {
  const h = event.headers || {};
  const src = h.origin || h.Origin || h.referer || h.Referer || '';
  if (!src) return true; // no Origin/Referer (server-to-server, health checks) — allow
  try { return ALLOWED_HOST_RE.test(new URL(src).hostname); } catch { return false; }
}

// ── Rate limiting ──────────────────────────────────────────────
// In-memory guards that throttle abuse of these public, unauthenticated
// endpoints (the Origin allowlist doesn't stop a non-browser client like curl).
// State lives in the warm function instance, so it is per-instance, not global —
// a hard, cross-instance spend ceiling needs shared state (Netlify Blobs) or an
// upstream Bi Frost quota. Limits are configurable via env.
function clientIp(event) {
  const h = event.headers || {};
  return h['x-nf-client-connection-ip'] ||
    (h['x-forwarded-for'] || '').split(',')[0].trim() ||
    h['client-ip'] || 'unknown';
}
const _hits = new Map();   // ip -> timestamps (ms) within the window
let _dayKey = '';
let _dayCount = 0;

export function rateLimit(event, {
  maxPerMin = Number(process.env.AI_MAX_PER_MIN) || 12,
  dailyCap  = Number(process.env.AI_DAILY_CAP)  || 1000,
} = {}) {
  const now = Date.now();

  // Per-instance daily backstop.
  const today = new Date().toISOString().slice(0, 10);
  if (today !== _dayKey) { _dayKey = today; _dayCount = 0; }
  if (_dayCount >= dailyCap) return { ok: false, retryAfter: 3600, reason: 'daily cap reached' };

  // Per-IP sliding window (60s).
  const ip = clientIp(event);
  const arr = (_hits.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= maxPerMin) {
    _hits.set(ip, arr);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((60000 - (now - arr[0])) / 1000)), reason: 'rate limit' };
  }
  arr.push(now);
  _hits.set(ip, arr);
  _dayCount++;

  // Opportunistic cleanup so the map can't grow unbounded.
  if (_hits.size > 5000) {
    for (const [k, v] of _hits) {
      const f = v.filter(t => now - t < 60000);
      if (f.length) _hits.set(k, f); else _hits.delete(k);
    }
  }
  return { ok: true };
}

// 429 response with a Retry-After header.
export function tooManyReply(rl) {
  return {
    statusCode: 429,
    headers: { ...JSON_HEADERS, 'Retry-After': String(rl.retryAfter || 30) },
    body: JSON.stringify({ error: `Too many requests (${rl.reason}). Please slow down and try again shortly.` }),
  };
}

// Walk the model chain — one Bi Frost chat-completions call each — with a
// per-attempt timeout bounded by an overall budget, so a stalled provider fails
// fast (and the next model gets a turn) and the handler always returns before
// Netlify's function timeout. Returns { ok, text, model, tried } or { ok:false, error, tried }.
export async function callBifrost({ chain, messages, maxTokens = 1500, totalBudgetMs = 9000, perAttemptMs = 8500 }) {
  const apiKey = getApiKey();
  const baseUrl = normalizeBaseUrl(process.env.BIFROST_BASE_URL);
  const start = Date.now();
  const tried = [];
  let lastError = 'No models attempted.';

  for (const model of uniq(chain)) {
    const remaining = totalBudgetMs - (Date.now() - start);
    // Out of budget: stop, but keep the prior attempt's error if it's more useful.
    if (remaining < 1500) { if (!tried.length) lastError = 'out of time budget before any attempt'; break; }
    tried.push(model);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(perAttemptMs, remaining));
    try {
      const r = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
        signal: ctrl.signal,
      });
      if (!r.ok) { lastError = `${model}: HTTP ${r.status}`; continue; }
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text || !text.trim()) { lastError = `${model}: empty response`; continue; }
      return { ok: true, text: text.trim(), model, tried };
    } catch (err) {
      lastError = err.name === 'AbortError' ? `${model}: timed out` : `${model}: ${err.message}`;
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, tried, error: lastError };
}
