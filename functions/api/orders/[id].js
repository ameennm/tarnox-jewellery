import { requireAdmin } from '../_shared/auth.js';
import { error, json, readJson, requireDatabase } from '../_shared/http.js';
import { orderFromRows } from '../_shared/commerce.js';

const STATUSES = new Set(['pending', 'confirmed', 'packed', 'shipped', 'completed', 'cancelled', 'stock_review']);
const PAYMENT_STATUSES = new Set(['unpaid', 'paid', 'refunded']);

async function getOrder(db, id) {
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) return null;
  const { results: items } = await db.prepare(`
    SELECT * FROM order_items
    WHERE order_id = ?
    ORDER BY created_at ASC
  `).bind(id).all();
  return orderFromRows(order, items);
}

export async function onRequestGet({ request, env, params }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const order = await getOrder(db, params.id);
  if (!order) return error('Order not found', 404);
  return json({ order });
}

export async function onRequestPatch({ request, env, params }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const body = await readJson(request);
  const status = body.status === undefined ? undefined : String(body.status || '').trim();
  const paymentStatus = body.payment_status === undefined ? undefined : String(body.payment_status || '').trim();
  if (status !== undefined && !STATUSES.has(status)) return error('Invalid order status');
  if (paymentStatus !== undefined && !PAYMENT_STATUSES.has(paymentStatus)) return error('Invalid payment status');

  const existing = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(params.id).first();
  if (!existing) return error('Order not found', 404);

  const { results: items } = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(params.id).all();
  const statements = [];

  if (status === 'cancelled' && existing.status !== 'cancelled') {
    statements.push(...items.map((item) => db.prepare(`
      UPDATE products
      SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(item.quantity, item.product_id)));
  }

  if (existing.status === 'cancelled' && status !== undefined && status !== 'cancelled') {
    for (const item of items) {
      const product = await db.prepare('SELECT stock_quantity, title FROM products WHERE id = ?').bind(item.product_id).first();
      if (!product || Number(product.stock_quantity || 0) < Number(item.quantity || 0)) {
        return error(`${item.title_snapshot} does not have enough stock to reopen this order`, 409);
      }
    }
    statements.push(...items.map((item) => db.prepare(`
      UPDATE products
      SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
      WHERE id = ? AND stock_quantity >= ?
    `).bind(item.quantity, item.product_id, item.quantity)));
  }

  statements.push(db.prepare(`
    UPDATE orders
    SET status = ?, payment_status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    status === undefined ? existing.status : status,
    paymentStatus === undefined ? existing.payment_status : paymentStatus,
    params.id
  ));

  await db.batch(statements);
  return json({ order: await getOrder(db, params.id) });
}
