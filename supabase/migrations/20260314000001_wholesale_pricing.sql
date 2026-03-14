-- Add wholesale_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2);

-- Update existing products to have a default wholesale price (e.g., 80% of retail)
UPDATE products SET wholesale_price = price * 0.8 WHERE wholesale_price IS NULL;
