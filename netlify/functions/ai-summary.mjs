// Netlify Function — AI Executive Summary
// ----------------------------------------
// Proxies Pattern's Bi Frost LLM gateway (https://bifrost.pattern.com), which
// exposes an OpenAI-compatible Chat Completions interface in front of Anthropic,
// OpenAI, Google, and Bedrock models. The BIFROST_API_KEY lives in a Netlify
// environment variable and is never sent to the browser.
//
// Bi Frost rules honoured here (see Pattern's bifrost-integration skill):
//   • Chat Completions contract (POST /v1/chat/completions), not the Responses API.
//   • Base URL normalised to end with /v1.
//   • Real model IDs from config/models.json (esbuild inlines this import).
//   • Cross-provider fallback chain; a per-provider 429 cascades to the next.
//   • max_tokens defaults to 2000; the API key is never logged.

import { readFileSync } from 'node:fs';

// config/models.json is the catalogue / fallback chain (Bi Frost convention).
// Read it at runtime relative to this file (deployed via netlify.toml
// `included_files`); fall back to an inline default if it can't be read.
const DEFAULT_MODELS = {
  default_model: 'anthropic/claude-sonnet-4-6',
  fallback_chain: ['anthropic/claude-sonnet-4-6', 'anthropic/claude-haiku-4-5', 'openai/gpt-4.1'],
};
function loadModels() {
  try {
    return JSON.parse(readFileSync(new URL('../../config/models.json', import.meta.url), 'utf8'));
  } catch {
    return DEFAULT_MODELS;
  }
}
const models = loadModels();

const SYSTEM_PROMPT = [
  'You are a senior SEO strategist at Pattern writing for a client.',
  'Write a concise executive summary of the SEO report data provided — exactly three short paragraphs, ~160 words total.',
  'Paragraph 1: the headline organic-performance story. Paragraph 2: the most urgent technical risks. Paragraph 3: the strategic priority / what to do next.',
  'Cite specific numbers from the data. Use a professional, direct tone.',
  'Output plain text paragraphs only — no preamble, no markdown headings, no bullet lists, no "Here is" opener.',
].join(' ');

function getApiKey() {
  // Accept either name — older Pattern tools use the shorter BIFROST_KEY.
  return process.env.BIFROST_API_KEY || process.env.BIFROST_KEY || '';
}

function normalizeBaseUrl(url) {
  const base = (url || 'https://bifrost.pattern.com').replace(/\/+$/, '');
  return base.endsWith('/v1') ? base : base + '/v1';
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const reply = (statusCode, obj) => ({ statusCode, headers: JSON_HEADERS, body: JSON.stringify(obj) });

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });

  const apiKey = getApiKey();
  if (!apiKey) {
    // Diagnostic: list BIFROST-named env vars the function can see (names only,
    // never values) to distinguish a name mismatch from a scope/context issue.
    const seen = Object.keys(process.env).filter(k => /bifrost|bi.?frost/i.test(k));
    return reply(500, {
      error: 'Server not configured: set BIFROST_API_KEY (or BIFROST_KEY) for the Functions scope in the Netlify environment, then redeploy.',
      bifrost_env_names_seen: seen,
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return reply(400, { error: 'Invalid JSON body.' });
  }
  const digest = (payload.digest || '').toString().trim();
  if (!digest) return reply(400, { error: "Missing 'digest' in request body." });

  const baseUrl = normalizeBaseUrl(process.env.BIFROST_BASE_URL);
  const chain = uniq([payload.model, models.default_model, ...(models.fallback_chain || [])]);
  const userContent = `Here is the SEO report data for ${payload.client || 'the client'}:\n\n${digest}`;

  const tried = [];
  let lastError = 'No models attempted.';

  for (const model of chain) {
    tried.push(model);
    try {
      const r = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent },
          ],
        }),
      });

      if (!r.ok) {
        // 429 / 5xx → try the next (cross-provider) model. Don't log the key or full body.
        lastError = `${model}: HTTP ${r.status}`;
        continue;
      }
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text || !text.trim()) {
        lastError = `${model}: empty response`;
        continue;
      }
      return reply(200, { summary: text.trim(), model, tried });
    } catch (err) {
      lastError = `${model}: ${err.message}`;
    }
  }

  return reply(502, { error: 'All models failed to generate a summary.', detail: lastError, tried });
}
