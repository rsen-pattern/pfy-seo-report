// Netlify Function — AI Chat over the report data
// ------------------------------------------------
// Multi-turn companion to ai-summary.mjs. The browser sends the running
// conversation plus a context digest of the report; this function prepends a
// system prompt + the data and relays the turn to Pattern's Bi Frost gateway.
// Shared Bi Frost plumbing lives in ./lib/bifrost.mjs. The BIFROST_API_KEY is
// read only on the server, never logged.
import { getApiKey, seenBifrostEnvNames, reply, JSON_HEADERS, originAllowed, callBifrost, loadModels } from './lib/bifrost.mjs';

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
  const chain = [payload.model, models.default_model, ...(models.fallback_chain || [])];

  const res = await callBifrost({
    chain,
    messages: [{ role: 'system', content: system }, ...convo],
    maxTokens: 1500,
  });
  if (!res.ok) return reply(502, { error: 'All models failed to answer.', detail: res.error, tried: res.tried });
  return reply(200, { reply: res.text, model: res.model, tried: res.tried });
}
