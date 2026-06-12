export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

export function error(message, status = 400, details = undefined) {
  return json({ error: message, details }, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function methodNotAllowed() {
  return error('Method not allowed', 405, {
    allowed: ['GET', 'POST', 'PATCH', 'DELETE']
  });
}

export function requireDatabase(env) {
  if (!env.DB) {
    throw new Error('Cloudflare D1 binding DB is not configured.');
  }
  return env.DB;
}
