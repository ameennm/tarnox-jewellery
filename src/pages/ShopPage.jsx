import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { Search, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import './ShopPage.css';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialCategory = searchParams.get('category') || 'All';
  const [category, setCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    setCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');
    
    if (category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (data) setProducts(data);
    setLoading(false);
  };

  const categories = ['All', 'Rings', 'Necklaces', 'Earrings', 'Bracelets'];

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="shop-page container">
      <div className="shop-header">
        <h1>Shop Collection</h1>
        <p>Explore our exquisite range of handcrafted jewellery</p>
      </div>

      <div className="shop-controls">
        <div className="categories-filter">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`cat-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setSearchParams({ category: cat })}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading our collection...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          {filteredProducts.length === 0 && (
            <div className="no-results">No products found matching your search.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopPage;
