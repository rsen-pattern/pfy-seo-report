// Netlify Function — AI Chat over the report data
// ------------------------------------------------
// Multi-turn companion to ai-summary.mjs. The browser sends the running
// conversation plus a compact context digest of the report; this function
// prepends a system prompt + the digest and relays the turn to Pattern's Bi
// Frost gateway (OpenAI-compatible /v1/chat/completions). The BIFROST_API_KEY
// lives only in the Netlify environment and is never sent to the browser.
//
// Same Bi Frost conventions as ai-summary.mjs: chat-completions contract,
// /v1 base-URL normalisation, real model IDs from config/models.json, a
// cross-provider fallback chain, max_tokens default, key never logged.

import { readFileSync } from 'node:fs';

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

// Abuse guards for a public, unauthenticated endpoint.
const MAX_TURNS = 20;          // keep only the most recent N messages
const MAX_MSG_CHARS = 4000;    // per message
const MAX_DIGEST_CHARS = 12000;

const SYSTEM_PROMPT = [
  'You are a senior SEO strategist at Pattern, answering a client\'s questions about their SEO report.',
  'Use ONLY the report data provided below as your source of truth; if a question cannot be answered from it, say so plainly rather than inventing numbers.',
  'Be concise and specific — cite the actual figures. Plain text, no markdown headings; short paragraphs or tight lists are fine.',
].join(' ');

function getApiKey() {
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

  // Sanitise the conversation: keep recent user/assistant turns, clamp lengths.
  const incoming = Array.isArray(payload.messages) ? payload.messages : [];
  const convo = incoming
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TURNS)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MSG_CHARS) }));
  if (!convo.length || convo[convo.length - 1].role !== 'user') {
    return reply(400, { error: 'messages must end with a user turn.' });
  }

  const digest = (payload.digest || '').toString().slice(0, MAX_DIGEST_CHARS);
  const system = `${SYSTEM_PROMPT}\n\n=== REPORT DATA ===\n${digest}`;

  const baseUrl = normalizeBaseUrl(process.env.BIFROST_BASE_URL);
  const chain = uniq([payload.model, models.default_model, ...(models.fallback_chain || [])]);

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
          messages: [{ role: 'system', content: system }, ...convo],
        }),
      });
      if (!r.ok) { lastError = `${model}: HTTP ${r.status}`; continue; }
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text || !text.trim()) { lastError = `${model}: empty response`; continue; }
      return reply(200, { reply: text.trim(), model, tried });
    } catch (err) {
      lastError = `${model}: ${err.message}`;
    }
  }

  return reply(502, { error: 'All models failed to answer.', detail: lastError, tried });
}
