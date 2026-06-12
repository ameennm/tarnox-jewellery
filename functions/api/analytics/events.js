import { recordAnalyticsEvent } from '../_shared/analytics.js';
import { json, readJson, requireDatabase } from '../_shared/http.js';

export async function onRequestPost({ request, env }) {
  const db = requireDatabase(env);
  const body = await readJson(request);
  const { headers } = await recordAnalyticsEvent(db, request, body);
  return json({ ok: true }, 201, headers);
}
