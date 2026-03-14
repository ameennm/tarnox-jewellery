import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';
import './ShopPage.css'; // Reusing shop styles

const WholesalePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="shop-page container">
      <div className="shop-header">
        <h1>Wholesale Selection</h1>
        <p>Premium jewellery at exclusive bulk rates for partners</p>
      </div>

      <div className="shop-controls">
        <div className="search-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search wholesale catalog..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading wholesale collection...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} isWholesale={true} />
          ))}
          {filteredProducts.length === 0 && (
            <div className="no-results">No wholesale products found matching your search.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default WholesalePage;
