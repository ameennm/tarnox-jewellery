import { isAdminRequest, requireAdmin } from '../_shared/auth.js';
import { error, json, readJson, requireDatabase } from '../_shared/http.js';
import { categoryFromRow, normalizeCategoryPayload, slugify } from '../_shared/commerce.js';

export async function onRequestGet({ request, env }) {
  const db = requireDatabase(env);
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get('includeInactive') === 'true'
    && await isAdminRequest(request, env);

  const where = includeInactive ? '' : 'WHERE c.is_active = 1';

  const { results } = await db.prepare(`
    SELECT
      c.*,
      COUNT(p.id) AS product_count,
      COALESCE(SUM(p.stock_quantity), 0) AS stock_count
    FROM categories c
    LEFT JOIN products p ON trim(p.category) = c.name AND p.is_active = 1
    ${where}
    GROUP BY c.id
    ORDER BY c.display_order ASC, c.name COLLATE NOCASE ASC
  `).all();

  return json({ categories: results.map(categoryFromRow) });
}

export async function onRequestPost({ request, env }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const body = await readJson(request);
  const category = normalizeCategoryPayload(body);

  if (!category.name) return error('Category name is required');

  const id = crypto.randomUUID();

  await db.prepare(`
    INSERT INTO categories (
      id, name, slug, image_url, display_order, is_active, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `).bind(
    id,
    category.name,
    `${slugify(category.name)}-${id.slice(0, 8)}`,
    category.image_url,
    category.display_order
  ).run();

  const row = await db.prepare(`
    SELECT c.*, 0 AS product_count, 0 AS stock_count
    FROM categories c
    WHERE c.id = ?
  `).bind(id).first();

  return json({ category: categoryFromRow(row) }, 201);
}
