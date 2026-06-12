export function toCents(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.round(number * 100);
}

export function fromCents(value) {
  return Number(value || 0) / 100;
}

export function normalizeImages(images) {
  if (Array.isArray(images)) {
    return images.map((image) => String(image).trim()).filter(Boolean);
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return normalizeImages(parsed);
    } catch {
      return images.split('\n').map((image) => image.trim()).filter(Boolean);
    }
  }

  return [];
}

export function productFromRow(row) {
  const images = normalizeImages(row.images);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    category: String(row.category || '').trim(),
    price: fromCents(row.price_cents),
    original_price: fromCents(row.original_price_cents || row.price_cents),
    wholesale_price: fromCents(row.wholesale_price_cents || row.price_cents),
    stock_quantity: Number(row.stock_quantity || 0),
    images,
    image_url: images[0] || '',
    is_active: row.is_active !== 0,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function categoryFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image_url: row.image_url || '',
    display_order: Number(row.display_order || 0),
    is_active: row.is_active !== 0,
    product_count: Number(row.product_count || 0),
    stock_count: Number(row.stock_count || 0),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function orderFromRows(order, items = []) {
  return {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name || '',
    customer_phone: order.customer_phone || '',
    customer_email: order.customer_email || '',
    customer_address: order.customer_address || '',
    notes: order.notes || '',
    status: order.status || 'pending',
    payment_status: order.payment_status || 'unpaid',
    source: order.source || 'website',
    total_amount: fromCents(order.total_amount_cents),
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      title: item.title_snapshot,
      unit_price: fromCents(item.unit_price_cents),
      quantity: Number(item.quantity || 0),
      line_total: fromCents(item.line_total_cents)
    }))
  };
}

export function slugify(value) {
  return String(value || 'product')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'product';
}

export function normalizeCategoryPayload(body, existing = {}) {
  return {
    name: String(body.name ?? existing.name ?? '').trim(),
    image_url: String(body.image_url ?? existing.image_url ?? '').trim(),
    display_order: body.display_order === undefined
      ? Number(existing.display_order || 0)
      : parseInt(body.display_order, 10) || 0,
    is_active: body.is_active === undefined
      ? existing.is_active !== 0
      : Boolean(body.is_active)
  };
}

export async function ensureCategory(db, name) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return;

  const existing = await db.prepare('SELECT id FROM categories WHERE name = ?').bind(cleanName).first();
  if (existing) return;

  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT OR IGNORE INTO categories (
      id, name, slug, image_url, display_order, is_active, created_at, updated_at
    )
    VALUES (?, ?, ?, '', 0, 1, datetime('now'), datetime('now'))
  `).bind(id, cleanName, `${slugify(cleanName)}-${id.slice(0, 8)}`).run();
}

export function generateOrderNumber() {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('');
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `TNX-${stamp}-${suffix}`;
}

export function normalizeProductPayload(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? '').trim();
  const category = String(body.category ?? existing.category ?? '').trim();
  const description = String(body.description ?? existing.description ?? '').trim();
  const priceCents = body.price === undefined ? existing.price_cents : toCents(body.price);
  const originalPriceCents = body.original_price === undefined
    ? (existing.original_price_cents ?? priceCents)
    : toCents(body.original_price);
  const wholesalePriceCents = body.wholesale_price === undefined
    ? (existing.wholesale_price_cents ?? priceCents)
    : toCents(body.wholesale_price);
  const stockQuantity = body.stock_quantity === undefined
    ? Number(existing.stock_quantity || 0)
    : Math.max(0, parseInt(body.stock_quantity, 10) || 0);
  const images = body.images === undefined ? normalizeImages(existing.images) : normalizeImages(body.images);

  return {
    title,
    category,
    description,
    price_cents: priceCents,
    original_price_cents: originalPriceCents,
    wholesale_price_cents: wholesalePriceCents,
    stock_quantity: stockQuantity,
    images
  };
}
