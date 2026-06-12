import { isAdminRequest } from '../_shared/auth.js';
import { json } from '../_shared/http.js';

export async function onRequestGet({ request, env }) {
  return json({ isAdmin: await isAdminRequest(request, env) });
}
