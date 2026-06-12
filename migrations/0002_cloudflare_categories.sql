-- Add editable product categories without changing existing product rows.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO categories (
  id, name, slug, image_url, display_order, is_active, created_at, updated_at
)
SELECT
  'cat-' || lower(hex(randomblob(8))),
  trimmed.category_name,
  lower(
    replace(
      replace(
        replace(trimmed.category_name, '&', 'and'),
        '/', '-'
      ),
      ' ', '-'
    )
  ) || '-' || lower(hex(randomblob(4))),
  '',
  0,
  1,
  datetime('now'),
  datetime('now')
FROM (
  SELECT DISTINCT trim(category) AS category_name
  FROM products
  WHERE trim(category) <> ''
) AS trimmed;

CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories(is_active, display_order, name);
