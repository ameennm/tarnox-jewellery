import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../lib/api';
import './ShopPage.css';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialCategory = searchParams.get('category') || 'All';
  const [category, setCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const cat = searchParams.get('category') || 'All';
    setCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const [{ products }, categoryResult] = await Promise.all([
        getProducts(),
        getCategories().catch(() => ({ categories: [] }))
      ]);
      setProducts(products);
      setCategoryRecords(categoryResult.categories || []);
    } catch (err) {
      setProducts([]);
      setError(err.message || 'Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const apiCategories = categoryRecords
      .map((categoryItem) => categoryItem.name?.trim())
      .filter(Boolean);

    const productCategories = products
      .map((product) => product.category?.trim())
      .filter(Boolean);

    const apiSet = new Set(apiCategories);
    const missingProductCategories = Array.from(new Set(productCategories))
      .filter((name) => !apiSet.has(name))
      .sort();

    return ['All', ...apiCategories, ...missingProductCategories];
  }, [categoryRecords, products]);

  const filteredProducts = products.filter(p =>
    (category === 'All' || p.category?.trim() === category) &&
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
              onClick={() => cat === 'All' ? setSearchParams({}) : setSearchParams({ category: cat })}
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
      ) : error ? (
        <div className="no-results">{error}</div>
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
