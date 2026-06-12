import { clearAdminCookie } from '../_shared/auth.js';
import { json } from '../_shared/http.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'set-cookie': clearAdminCookie() });
}
