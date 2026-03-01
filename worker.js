/**
 * Cloudflare Worker — BaristaAI API proxy
 *
 * Proxies requests to the Anthropic API so the API key never
 * has to be embedded in the public frontend code.
 *
 * Deploy to Cloudflare Workers and set the secret:
 *   wrangler secret put ANTHROPIC_API_KEY
 * or via the Cloudflare dashboard → Workers → Settings → Variables.
 *
 * Set ALLOWED_ORIGIN below to your GitHub Pages URL, e.g.:
 *   https://your-username.github.io
 */

const ALLOWED_ORIGIN = 'https://YOUR-USERNAME.github.io'; // ← update this
const ANTHROPIC_URL  = 'https://api.anthropic.com/v1/messages';

export default {
  async fetch(request, env) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, request);
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Check origin
    const origin = request.headers.get('Origin') || '';
    if (ALLOWED_ORIGIN !== '*' && origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Forward to Anthropic
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.text();
    return corsResponse(data, upstream.status, request, 'application/json');
  },
};

function corsResponse(body, status, request, contentType = 'text/plain') {
  const origin = request.headers.get('Origin') || '*';
  const headers = {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGIN === '*' ? '*' : origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (contentType) headers['Content-Type'] = contentType;
  return new Response(body, { status, headers });
}
