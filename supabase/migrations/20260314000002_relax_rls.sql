-- Relax RLS for Products Table
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow admin all access" ON products;
CREATE POLICY "Allow all access" ON products FOR ALL USING (true) WITH CHECK (true);

-- Relax RLS for Orders Table
DROP POLICY IF EXISTS "Allow authenticated insert" ON orders;
DROP POLICY IF EXISTS "Allow admin read orders" ON orders;
CREATE POLICY "Allow all access" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Relax RLS for Storage (tarnox bucket)
-- Note: This allows public uploads/deletes. Suitable only for this specific "simple" request.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tarnox', 'tarnox', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'tarnox') WITH CHECK (bucket_id = 'tarnox');
