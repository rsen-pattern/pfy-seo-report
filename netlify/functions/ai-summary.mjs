// Netlify Function — AI Executive Summary
// ----------------------------------------
// Proxies Pattern's Bi Frost LLM gateway (OpenAI-compatible Chat Completions).
// The BIFROST_API_KEY lives only in the Netlify environment, never in the
// browser. Shared Bi Frost plumbing (key handling, /v1 normalisation, model
// fallback chain with per-attempt timeout, origin allowlist) lives in
// ./lib/bifrost.mjs.
import { getApiKey, seenBifrostEnvNames, reply, JSON_HEADERS, originAllowed, callBifrost, loadModels } from './lib/bifrost.mjs';

const models = loadModels();

const SYSTEM_PROMPT = [
  'You are a senior SEO strategist at Pattern writing for a client.',
  'Write a concise executive summary of the SEO report data provided — exactly three short paragraphs, ~160 words total.',
  'Paragraph 1: the headline organic-performance story. Paragraph 2: the most urgent technical risks. Paragraph 3: the strategic priority / what to do next.',
  'Cite specific numbers from the data. Use a professional, direct tone.',
  'Output plain text paragraphs only — no preamble, no markdown headings, no bullet lists, no "Here is" opener.',
].join(' ');

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (!originAllowed(event)) return reply(403, { error: 'Forbidden: origin not allowed.' });

  if (!getApiKey()) {
    return reply(500, {
      error: 'Server not configured: set BIFROST_API_KEY (or BIFROST_KEY) for the Functions scope in the Netlify environment, then redeploy.',
      bifrost_env_names_seen: seenBifrostEnvNames(),
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

  const chain = [payload.model, models.default_model, ...(models.fallback_chain || [])];
  const userContent = `Here is the SEO report data for ${payload.client || 'the client'}:\n\n${digest}`;

  // ~800 tokens is ample for a 3-paragraph summary and keeps latency well under
  // Netlify's synchronous function timeout.
  const res = await callBifrost({
    chain,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
    maxTokens: 800,
  });
  if (!res.ok) return reply(502, { error: 'All models failed to generate a summary.', detail: res.error, tried: res.tried });
  return reply(200, { summary: res.text, model: res.model, tried: res.tried });
}
