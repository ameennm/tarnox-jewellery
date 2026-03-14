import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, isWholesale = false }) => {
  const { addToCart } = useCart();
  const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  const displayPrice = isWholesale ? product.wholesale_price : product.price;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="product-card animate-fade-in">
      <div className="product-image-container" onClick={images.length > 1 ? nextImage : undefined}>
        <img src={images[currentImgIndex]} alt={product.title} className="product-image" />
        
        {images.length > 1 && (
          <div className="image-dots">
            {images.map((_, i) => (
              <span key={i} className={`dot ${i === currentImgIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
        
        <div className="product-overlay">
          <button className="btn-icon" title="View Details">
            <Eye size={20} />
          </button>
          <button 
            className="btn-icon" 
            title="Add to Cart"
            onClick={() => addToCart({ ...product, price: displayPrice })}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3 className="product-title">{product.title}</h3>
        <div className="product-price-container">
          <p className="product-price">₹{parseFloat(displayPrice).toFixed(2)}</p>
          {!isWholesale && product.original_price && product.original_price > product.price && (
            <div className="discount-info">
              <span className="original-price">₹{parseFloat(product.original_price).toFixed(2)}</span>
              <span className="discount-tag">
                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% off
              </span>
            </div>
          )}
        </div>
        {isWholesale && <p className="wholesale-badge">Wholesale Rate</p>}
        <button 
          className="btn btn-outline btn-full"
          onClick={() => addToCart({ ...product, price: displayPrice })}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
