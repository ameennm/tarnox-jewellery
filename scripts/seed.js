import 'dotenv/config';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY // Using secret key to bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const products = [
  {
    title: 'Diamond Solitaire Ring',
    description: 'A stunning 1-carat diamond set in 18k white gold.',
    price: 1200.00,
    category: 'Rings',
    image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80',
    stock_quantity: 10
  },
  {
    title: 'Gold Pearl Necklace',
    description: 'Elegant freshwater pearls with a 14k gold clasp.',
    price: 450.00,
    category: 'Necklaces',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80',
    stock_quantity: 15
  },
  {
    title: 'Sapphire Earrings',
    description: 'Deep blue sapphires surrounded by a halo of diamonds.',
    price: 850.00,
    category: 'Earrings',
    image_url: 'https://images.unsplash.com/photo-1635767790474-325ecd27284f?auto=format&fit=crop&q=80',
    stock_quantity: 8
  }
];

async function seed() {
  console.log('Seeding products...');
  for (const product of products) {
    const { data, error } = await supabase.from('products').insert([product]);
    if (error) console.error(`Error inserting ${product.title}:`, error.message);
    else console.log(`Inserted: ${product.title}`);
  }
  console.log('Seeding complete!');
}

seed();
