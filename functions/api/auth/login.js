import { createAdminCookie } from '../_shared/auth.js';
import { error, json, readJson } from '../_shared/http.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const password = String(body.password || '');

  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return error('Admin authentication is not configured', 500);
  }

  if (password !== env.ADMIN_PASSWORD) {
    return error('Invalid password', 401);
  }

  const cookie = await createAdminCookie(request, env);
  return json({ isAdmin: true }, 200, { 'set-cookie': cookie });
}
