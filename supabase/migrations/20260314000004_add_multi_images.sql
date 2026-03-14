-- Add images column as a text array to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Migrate existing image_url into the first element of images if images is empty
UPDATE products 
SET images = ARRAY[image_url] 
WHERE (images IS NULL OR ARRAY_LENGTH(images, 1) IS NULL) AND image_url IS NOT NULL;
