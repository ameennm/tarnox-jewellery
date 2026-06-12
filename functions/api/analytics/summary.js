import { requireAdmin } from '../_shared/auth.js';
import { json, requireDatabase } from '../_shared/http.js';
import { fromCents } from '../_shared/commerce.js';

async function scalar(db, sql, ...params) {
  const row = await db.prepare(sql).bind(...params).first();
  return Number(Object.values(row || { value: 0 })[0] || 0);
}

function mapEventRows(rows) {
  return rows.map((row) => ({
    path: row.path,
    event_type: row.event_type,
    count: Number(row.count || 0),
    visitors: Number(row.visitors || 0)
  }));
}

export async function onRequestGet({ request, env }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7', 10), 1), 90);
  const since = `-${days} days`;

  const [
    visitors,
    pageViews,
    checkoutStarts,
    ordersCreatedEvents,
    whatsappClicks,
    clicks,
    unpaidOrders,
    revenueCents
  ] = await Promise.all([
    scalar(db, `SELECT COUNT(DISTINCT visitor_id) AS value FROM analytics_events WHERE created_at >= datetime('now', ?)`, since),
    scalar(db, `SELECT COUNT(*) AS value FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', ?)`, since),
    scalar(db, `SELECT COUNT(*) AS value FROM analytics_events WHERE event_type = 'checkout_started' AND created_at >= datetime('now', ?)`, since),
    scalar(db, `SELECT COUNT(*) AS value FROM analytics_events WHERE event_type = 'order_created' AND created_at >= datetime('now', ?)`, since),
    scalar(db, `SELECT COUNT(*) AS value FROM analytics_events WHERE event_type = 'whatsapp_click' AND created_at >= datetime('now', ?)`, since),
    scalar(db, `SELECT COUNT(*) AS value FROM analytics_events WHERE event_type = 'click' AND created_at >= datetime('now', ?)`, since),
    scalar(db, `SELECT COUNT(*) AS value FROM orders WHERE payment_status = 'unpaid' AND status != 'cancelled' AND created_at >= datetime('now', ?)`, since),
    scalar(db, `SELECT COALESCE(SUM(total_amount_cents), 0) AS value FROM orders WHERE status != 'cancelled' AND created_at >= datetime('now', ?)`, since)
  ]);

  const { results: topPages } = await db.prepare(`
    SELECT path, event_type, COUNT(*) AS count, COUNT(DISTINCT visitor_id) AS visitors
    FROM analytics_events
    WHERE event_type = 'page_view' AND created_at >= datetime('now', ?)
    GROUP BY path, event_type
    ORDER BY count DESC
    LIMIT 8
  `).bind(since).all();

  const { results: funnelEvents } = await db.prepare(`
    SELECT event_type, COUNT(*) AS count, COUNT(DISTINCT visitor_id) AS visitors
    FROM analytics_events
    WHERE event_type IN ('page_view', 'add_to_cart', 'checkout_started', 'order_created', 'whatsapp_click')
      AND created_at >= datetime('now', ?)
    GROUP BY event_type
  `).bind(since).all();

  const { results: heatmap } = await db.prepare(`
    SELECT path, x, y, viewport_width, viewport_height, COUNT(*) AS count
    FROM analytics_events
    WHERE event_type = 'click'
      AND x IS NOT NULL
      AND y IS NOT NULL
      AND created_at >= datetime('now', ?)
    GROUP BY path, ROUND(x / 40), ROUND(y / 40), ROUND(viewport_width / 100), ROUND(viewport_height / 100)
    ORDER BY count DESC
    LIMIT 80
  `).bind(since).all();

  const { results: missedWhatsappLeads } = await db.prepare(`
    SELECT
      o.id,
      o.order_number,
      o.customer_name,
      o.customer_phone,
      o.customer_email,
      o.total_amount_cents,
      o.status,
      o.payment_status,
      o.created_at
    FROM orders o
    LEFT JOIN analytics_events e
      ON e.order_id = o.id AND e.event_type = 'whatsapp_click'
    WHERE e.id IS NULL
      AND o.status != 'cancelled'
      AND o.created_at >= datetime('now', ?)
    ORDER BY o.created_at DESC
    LIMIT 25
  `).bind(since).all();

  return json({
    range_days: days,
    summary: {
      visitors,
      page_views: pageViews,
      checkout_starts: checkoutStarts,
      orders_created: ordersCreatedEvents,
      unpaid_orders: unpaidOrders,
      whatsapp_clicks: whatsappClicks,
      missed_whatsapp: missedWhatsappLeads.length,
      click_events: clicks,
      live_revenue: fromCents(revenueCents)
    },
    top_pages: mapEventRows(topPages),
    funnel: funnelEvents.map((event) => ({
      event_type: event.event_type,
      count: Number(event.count || 0),
      visitors: Number(event.visitors || 0)
    })),
    heatmap: heatmap.map((point) => ({
      path: point.path,
      x: Number(point.x || 0),
      y: Number(point.y || 0),
      viewport_width: Number(point.viewport_width || 0),
      viewport_height: Number(point.viewport_height || 0),
      count: Number(point.count || 0)
    })),
    missed_whatsapp_leads: missedWhatsappLeads.map((lead) => ({
      ...lead,
      total_amount: fromCents(lead.total_amount_cents)
    }))
  });
}
