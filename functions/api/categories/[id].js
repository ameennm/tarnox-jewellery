import { requireAdmin } from '../_shared/auth.js';
import { error, json, readJson, requireDatabase } from '../_shared/http.js';
import { categoryFromRow, normalizeCategoryPayload, slugify } from '../_shared/commerce.js';

export async function onRequestPatch({ request, env, params }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  const existing = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(params.id).first();
  if (!existing) return error('Category not found', 404);

  const body = await readJson(request);
  const category = normalizeCategoryPayload(body, existing);
  if (!category.name) return error('Category name is required');

  const nextSlug = body.name === undefined ? existing.slug : `${slugify(category.name)}-${params.id.slice(0, 8)}`;

  await db.prepare(`
    UPDATE categories
    SET name = ?, slug = ?, image_url = ?, display_order = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    category.name,
    nextSlug,
    category.image_url,
    category.display_order,
    category.is_active ? 1 : 0,
    params.id
  ).run();

  if (category.name !== existing.name) {
    await db.prepare(`
      UPDATE products
      SET category = ?, updated_at = datetime('now')
      WHERE trim(category) = ?
    `).bind(category.name, existing.name).run();
  }

  const row = await db.prepare(`
    SELECT
      c.*,
      COUNT(p.id) AS product_count,
      COALESCE(SUM(p.stock_quantity), 0) AS stock_count
    FROM categories c
    LEFT JOIN products p ON trim(p.category) = c.name AND p.is_active = 1
    WHERE c.id = ?
    GROUP BY c.id
  `).bind(params.id).first();

  return json({ category: categoryFromRow(row) });
}

export async function onRequestDelete({ request, env, params }) {
  const authError = await requireAdmin(request, env);
  if (authError) return authError;

  const db = requireDatabase(env);
  await db.prepare(`
    UPDATE categories
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `).bind(params.id).run();

  return json({ ok: true });
}
