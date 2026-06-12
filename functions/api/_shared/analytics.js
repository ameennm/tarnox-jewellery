const VISITOR_COOKIE = 'tarnox_visitor_id';
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 365;

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getOrCreateVisitorId(request) {
  const current = getCookie(request, VISITOR_COOKIE);
  if (current) return { visitorId: current, isNew: false };
  return { visitorId: crypto.randomUUID(), isNew: true };
}

export function visitorCookie(request, visitorId) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${VISITOR_COOKIE}=${visitorId}; Path=/; SameSite=Lax${secure}; Max-Age=${VISITOR_TTL_SECONDS}`;
}

export async function recordAnalyticsEvent(db, request, event) {
  const resolvedVisitor = getOrCreateVisitorId(request);
  const visitorId = event.visitor_id || resolvedVisitor.visitorId;
  const isNew = !event.visitor_id && resolvedVisitor.isNew;
  const headers = {};

  if (isNew) {
    headers['set-cookie'] = visitorCookie(request, visitorId);
  }

  await db.prepare(`
    INSERT INTO analytics_events (
      id, visitor_id, event_type, path, order_id, product_id,
      x, y, viewport_width, viewport_height, metadata, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    crypto.randomUUID(),
    visitorId,
    String(event.event_type || event.type || 'event').slice(0, 80),
    String(event.path || new URL(request.url).pathname).slice(0, 300),
    event.order_id || null,
    event.product_id || null,
    Number.isFinite(Number(event.x)) ? Math.round(Number(event.x)) : null,
    Number.isFinite(Number(event.y)) ? Math.round(Number(event.y)) : null,
    Number.isFinite(Number(event.viewport_width)) ? Math.round(Number(event.viewport_width)) : null,
    Number.isFinite(Number(event.viewport_height)) ? Math.round(Number(event.viewport_height)) : null,
    JSON.stringify(event.metadata || {})
  ).run();

  return { visitorId, headers };
}
