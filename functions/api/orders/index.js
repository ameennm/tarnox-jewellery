import { requireAdmin } from '../_shared/auth.js';
import { getOrCreateVisitorId, recordAnalyticsEvent, visitorCookie } from '../_shared/analytics.js';
import { error, json, readJson, requireDatabase } from '../_shared/http.js';
import { generateOrderNumber, orderFromRows } from '../_shared/commerce.js';

async function getOrders(db, limit = 100) {
  const { results: orders } = await db.prepare(`
    SELECT * FROM orders
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all();

  if (!orders.length) return [];

  const placeholders = orders.map(() => '?').join(',');
  const { results: items } = await db.prepare(`
    SELECT * FROM order_items
    WHERE order_id IN (${placeholders})
    ORDER BY created_at ASC
  `).bind(...orders.map((order) => order.id)).all();

  return orders.map((order) => orderFromRows(
    order,
    items.filter((item) => item.order_id === order.id)
  ));
}

export async function onRequestGet({ request, env }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 250);
  return json({ orders: await getOrders(db, limit) });
}

export async function onRequestPost({ request, env }) {
  const db = requireDatabase(env);
  const body = await readJson(request);
  const customer = body.customer || {};
  const items = Array.isArray(body.items) ? body.items : [];

  const customerName = String(customer.name || '').trim();
  const customerPhone = String(customer.phone || '').trim();
  const customerEmail = String(customer.email || '').trim();
  const customerAddress = String(customer.address || '').trim();
  const notes = String(customer.notes || '').trim();

  if (!customerName) return error('Customer name is required');
  if (!customerPhone) return error('Customer phone is required');
  if (!items.length) return error('Cart is empty');

  const normalizedItems = items
    .map((item) => ({
      product_id: String(item.product_id || item.id || '').trim(),
      quantity: Math.max(0, parseInt(item.quantity, 10) || 0)
    }))
    .filter((item) => item.product_id && item.quantity > 0);

  if (!normalizedItems.length) return error('Cart items are invalid');

  const uniqueIds = [...new Set(normalizedItems.map((item) => item.product_id))];
  const placeholders = uniqueIds.map(() => '?').join(',');
  const { results: products } = await db.prepare(`
    SELECT * FROM products
    WHERE id IN (${placeholders}) AND is_active = 1
  `).bind(...uniqueIds).all();

  const productsById = new Map(products.map((product) => [product.id, product]));
  let totalAmountCents = 0;
  const orderItems = [];

  for (const cartItem of normalizedItems) {
    const product = productsById.get(cartItem.product_id);
    if (!product) return error('One or more products are unavailable', 409);
    if (Number(product.stock_quantity || 0) < cartItem.quantity) {
      return error(`${product.title} has only ${product.stock_quantity || 0} left in stock`, 409);
    }

    const lineTotalCents = Number(product.price_cents) * cartItem.quantity;
    totalAmountCents += lineTotalCents;
    orderItems.push({
      id: crypto.randomUUID(),
      product_id: product.id,
      title_snapshot: product.title,
      unit_price_cents: Number(product.price_cents),
      quantity: cartItem.quantity,
      line_total_cents: lineTotalCents
    });
  }

  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const { visitorId, isNew } = getOrCreateVisitorId(request);
  const statements = [
    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_phone, customer_email,
        customer_address, notes, total_amount_cents, status, payment_status,
        source, visitor_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', 'website', ?, datetime('now'), datetime('now'))
    `).bind(
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      notes,
      totalAmountCents,
      visitorId
    ),
    ...orderItems.map((item) => db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, title_snapshot, unit_price_cents,
        quantity, line_total_cents, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      item.id,
      orderId,
      item.product_id,
      item.title_snapshot,
      item.unit_price_cents,
      item.quantity,
      item.line_total_cents
    )),
    ...orderItems.map((item) => db.prepare(`
      UPDATE products
      SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
      WHERE id = ? AND stock_quantity >= ?
    `).bind(item.quantity, item.product_id, item.quantity))
  ];

  const results = await db.batch(statements);
  const stockResults = results.slice(-orderItems.length);
  const stockChanged = stockResults.every((result) => Number(result.meta?.changes || 0) === 1);

  if (!stockChanged) {
    await db.prepare(`
      UPDATE orders
      SET status = 'stock_review', updated_at = datetime('now')
      WHERE id = ?
    `).bind(orderId).run();
    return error('Inventory changed while the order was being placed. Please refresh the cart.', 409);
  }

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
  await recordAnalyticsEvent(db, request, {
    type: 'order_created',
    visitor_id: visitorId,
    path: '/cart',
    order_id: orderId,
    metadata: { order_number: orderNumber, total_amount_cents: totalAmountCents }
  });

  const headers = isNew ? { 'set-cookie': visitorCookie(request, visitorId) } : {};
  return json({ order: orderFromRows(order, orderItems) }, 201, headers);
}
