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
