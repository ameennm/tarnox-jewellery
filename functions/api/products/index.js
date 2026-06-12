import { isAdminRequest, requireAdmin } from '../_shared/auth.js';
import { error, json, readJson, requireDatabase } from '../_shared/http.js';
import { ensureCategory, normalizeProductPayload, productFromRow, slugify } from '../_shared/commerce.js';

export async function onRequestGet({ request, env }) {
  const db = requireDatabase(env);
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const featured = url.searchParams.get('featured') === 'true';
  const includeInactive = url.searchParams.get('includeInactive') === 'true'
    && await isAdminRequest(request, env);
  const limit = featured ? 3 : Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);

  const where = [];
  const params = [];

  if (!includeInactive) where.push('is_active = 1');
  if (category && category !== 'All') {
    where.push('category = ?');
    params.push(category);
  }
  if (search) {
    where.push('LOWER(title) LIKE ?');
    params.push(`%${search.toLowerCase()}%`);
  }

  const sql = `
    SELECT * FROM products
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at DESC
    LIMIT ?
  `;
  params.push(limit);

  const { results } = await db.prepare(sql).bind(...params).all();
  return json({ products: results.map(productFromRow) });
}

export async function onRequestPost({ request, env }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const body = await readJson(request);
  const product = normalizeProductPayload(body);

  if (!product.title) return error('Product title is required');
  if (product.price_cents <= 0) return error('Retail price must be greater than zero');

  await ensureCategory(db, product.category);

  const id = crypto.randomUUID();
  const slug = `${slugify(product.title)}-${id.slice(0, 8)}`;

  await db.prepare(`
    INSERT INTO products (
      id, title, slug, description, category, price_cents, original_price_cents,
      wholesale_price_cents, stock_quantity, images, is_active, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `).bind(
    id,
    product.title,
    slug,
    product.description,
    product.category,
    product.price_cents,
    product.original_price_cents,
    product.wholesale_price_cents,
    product.stock_quantity,
    JSON.stringify(product.images)
  ).run();

  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  return json({ product: productFromRow(row) }, 201);
}
