-- Add original_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- OPTIONAL: Default original_price to price if null (to avoid massive discount badges on existing products)
UPDATE products SET original_price = price WHERE original_price IS NULL;
