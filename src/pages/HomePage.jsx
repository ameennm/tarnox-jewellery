import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, MessageCircle, ShieldCheck } from 'lucide-react';
import { getCategories, getProducts } from '../lib/api';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const fallbackCategories = [
  { name: 'Rings', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80' },
  { name: 'Necklaces', image_url: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80' },
  { name: 'Earrings', image_url: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80' },
  { name: 'Bracelets', image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80' }
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [{ products }, categoryResult] = await Promise.all([
          getProducts({ featured: true }),
          getCategories().catch(() => ({ categories: [] }))
        ]);
        setFeaturedProducts(products);
        setCategories(categoryResult.categories || []);
      } catch {
        setFeaturedProducts([]);
      }
    };
    fetchHomeData();
  }, []);

  const visibleCategories = (categories.length ? categories : fallbackCategories).slice(0, 6);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text animate-fade-in">
            <span className="hero-subtitle">Tarnox Jewellery</span>
            <h1>Fine Jewellery, Checked For Stock Before You Order</h1>
            <p>Choose the quantity you need, place a tracked order, and continue the conversation on WhatsApp with an order number already created.</p>
            <div className="hero-btns">
              <Link to="/shop" className="btn btn-primary">
                Shop Collection <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn btn-outline">Our Story</Link>
            </div>
          </div>
          <div className="hero-image animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="image-wrapper">
              <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80" alt="Premium Jewellery" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <p>Thoughtfully curated collections for every style</p>
          </div>
          <div className="category-grid">
            {visibleCategories.map((cat, idx) => (
              <Link 
                to={`/shop?category=${cat.name}`} 
                key={cat.name} 
                className="category-card animate-fade-in"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <div className="category-image">
                  <img src={cat.image_url || fallbackCategories[idx % fallbackCategories.length].image_url} alt={cat.name} />
                  <div className="category-overlay">
                    <h3>{cat.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features bg-accent">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <ClipboardCheck size={32} />
              <h3>Tracked Orders</h3>
              <p>Every checkout creates an order before follow-up</p>
            </div>
            <div className="feature-item">
              <ShieldCheck size={32} />
              <h3>Live Inventory</h3>
              <p>Stock is reduced only when the order is placed</p>
            </div>
            <div className="feature-item">
              <MessageCircle size={32} />
              <h3>WhatsApp Support</h3>
              <p>Quick help after checkout, not a lost cart redirect</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <div className="section-header">
            <h2>Featured Collection</h2>
            <Link to="/shop" className="view-all">View All Products</Link>
          </div>
          <div className="products-grid">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p>Loading curated selection...</p>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
