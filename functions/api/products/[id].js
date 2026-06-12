import { requireAdmin } from '../_shared/auth.js';
import { error, json, readJson, requireDatabase } from '../_shared/http.js';
import { ensureCategory, normalizeProductPayload, productFromRow, slugify } from '../_shared/commerce.js';

export async function onRequestGet({ env, params }) {
  const db = requireDatabase(env);
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(params.id).first();
  if (!row || row.is_active === 0) return error('Product not found', 404);
  return json({ product: productFromRow(row) });
}

export async function onRequestPatch({ request, env, params }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const existing = await db.prepare('SELECT * FROM products WHERE id = ?').bind(params.id).first();
  if (!existing) return error('Product not found', 404);

  const body = await readJson(request);
  const product = normalizeProductPayload(body, existing);
  if (!product.title) return error('Product title is required');
  if (product.price_cents <= 0) return error('Retail price must be greater than zero');

  await ensureCategory(db, product.category);

  const slug = body.title === undefined ? existing.slug : `${slugify(product.title)}-${params.id.slice(0, 8)}`;

  await db.prepare(`
    UPDATE products
    SET title = ?, slug = ?, description = ?, category = ?, price_cents = ?,
        original_price_cents = ?, wholesale_price_cents = ?, stock_quantity = ?,
        images = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    product.title,
    slug,
    product.description,
    product.category,
    product.price_cents,
    product.original_price_cents,
    product.wholesale_price_cents,
    product.stock_quantity,
    JSON.stringify(product.images),
    body.is_active === undefined ? existing.is_active : (body.is_active ? 1 : 0),
    params.id
  ).run();

  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(params.id).first();
  return json({ product: productFromRow(row) });
}

export async function onRequestDelete({ request, env, params }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  await db.prepare(`
    UPDATE products
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `).bind(params.id).run();

  return json({ ok: true });
}
