-- Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    items JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic RLS (Row Level Security) - allow everyone to see products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);

-- Only admins can modify products (can refine this based on your user structure)
CREATE POLICY "Allow admin all access" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read orders" ON orders FOR SELECT USING (auth.role() = 'authenticated');

-- Insert initial dummy items
INSERT INTO products (title, description, price, category, image_url, stock_quantity)
VALUES 
('Diamond Solitaire Ring', 'A stunning 1-carat diamond set in 18k white gold.', 1200.00, 'Rings', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80', 10),
('Gold Pearl Necklace', 'Elegant freshwater pearls with a 14k gold clasp.', 450.00, 'Necklaces', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80', 15),
('Sapphire Earrings', 'Deep blue sapphires surrounded by a halo of diamonds.', 850.00, 'Earrings', 'https://images.unsplash.com/photo-1635767790474-325ecd27284f?auto=format&fit=crop&q=80', 8);
