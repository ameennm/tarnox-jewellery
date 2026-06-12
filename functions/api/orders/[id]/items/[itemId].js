import { requireAdmin } from '../../../_shared/auth.js';
import { error, json, readJson, requireDatabase } from '../../../_shared/http.js';
import { orderFromRows } from '../../../_shared/commerce.js';

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

export async function onRequestPatch({ request, env, params }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const body = await readJson(request);
  const nextQuantity = Math.max(1, parseInt(body.quantity, 10) || 1);

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(params.id).first();
  if (!order) return error('Order not found', 404);
  if (order.status === 'cancelled') return error('Cancelled orders cannot be edited', 409);

  const item = await db.prepare(`
    SELECT * FROM order_items
    WHERE id = ? AND order_id = ?
  `).bind(params.itemId, params.id).first();
  if (!item) return error('Order item not found', 404);

  const diff = nextQuantity - Number(item.quantity || 0);
  if (diff > 0) {
    const product = await db.prepare('SELECT stock_quantity FROM products WHERE id = ?').bind(item.product_id).first();
    if (!product || Number(product.stock_quantity || 0) < diff) {
      return error('Not enough stock available for this adjustment', 409);
    }
  }

  const lineTotalCents = Number(item.unit_price_cents) * nextQuantity;
  const statements = [];

  if (diff !== 0) {
    statements.push(db.prepare(`
      UPDATE products
      SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
      WHERE id = ? AND stock_quantity - ? >= 0
    `).bind(diff, item.product_id, diff));
  }

  statements.push(db.prepare(`
    UPDATE order_items
    SET quantity = ?, line_total_cents = ?, updated_at = datetime('now')
    WHERE id = ? AND order_id = ?
  `).bind(nextQuantity, lineTotalCents, params.itemId, params.id));

  statements.push(db.prepare(`
    UPDATE orders
    SET total_amount_cents = (
      SELECT COALESCE(SUM(line_total_cents), 0)
      FROM order_items
      WHERE order_id = ?
    ),
    updated_at = datetime('now')
    WHERE id = ?
  `).bind(params.id, params.id));

  const results = await db.batch(statements);
  if (diff !== 0 && Number(results[0].meta?.changes || 0) !== 1) {
    return error('Inventory changed before the adjustment could be saved', 409);
  }

  return json({ order: await getOrder(db, params.id) });
}
