import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Users, ShoppingCart, Plus, Edit, Trash2 } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const { logout } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: '',
    price: '',
    original_price: '',
    wholesale_price: '',
    stock_quantity: '',
    images: [] // Changed from image_url to images array
  });
  const [imageFiles, setImageFiles] = useState([]); // Changed from imageFile to array

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (pData) setProducts(pData);
    if (oData) setOrders(oData);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewProduct({ title: '', category: '', price: '', original_price: '', wholesale_price: '', stock_quantity: '', images: [] });
    setImageFiles([]);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setNewProduct({
      title: product.title,
      category: product.category,
      price: product.price.toString(),
      original_price: (product.original_price || product.price).toString(),
      wholesale_price: product.wholesale_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      images: product.images || [product.image_url]
    });
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setIsUploading(true);
    const urls = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('tarnox')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('tarnox')
        .getPublicUrl(filePath);
      
      urls.push(publicUrl);
    }

    setIsUploading(false);
    return urls;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    let finalImages = [...newProduct.images];

    if (imageFiles.length > 0) {
      const uploadedUrls = await uploadImages();
      finalImages = [...finalImages, ...uploadedUrls];
    }

    const productData = {
      title: newProduct.title,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      original_price: parseFloat(newProduct.original_price || newProduct.price),
      wholesale_price: parseFloat(newProduct.wholesale_price),
      stock_quantity: parseInt(newProduct.stock_quantity),
      images: finalImages,
      image_url: finalImages[0] || '' // Sync for backward compatibility
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('products').update(productData).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('products').insert([productData]);
      error = insertError;
    }

    if (error) {
      alert('Error saving product: ' + error.message);
    } else {
      closeModal();
      fetchData();
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        alert('Error deleting product: ' + error.message);
      } else {
        fetchData();
      }
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={() => logout()}>Logout</button>
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button 
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
          </div>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card glass-morphism">
          <Package size={24} />
          <div>
            <h3>{products.length}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="stat-card glass-morphism">
          <ShoppingCart size={24} />
          <div>
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card glass-morphism">
          <Users size={24} />
          <div>
            <h3>0</h3>
            <p>Customers</p>
          </div>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="admin-content animate-fade-in">
          <div className="content-header">
            <h2>Product Management</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Add Product
            </button>
          </div>
          
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal glass-morphism">
                <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSaveProduct}>
                  <div className="form-group">
                    <label>Title</label>
                    <input 
                      type="text" 
                      required 
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input 
                      type="text" 
                      required 
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    />
                  </div>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Retail Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Original Price / MRP (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        value={newProduct.original_price}
                        onChange={(e) => setNewProduct({...newProduct, original_price: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Wholesale Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      value={newProduct.wholesale_price}
                      onChange={(e) => setNewProduct({...newProduct, wholesale_price: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input 
                      type="number" 
                      required 
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Product Images (Multiple possible)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    {newProduct.images.length > 0 && (
                      <div className="current-images-preview">
                        <small>Existing images: {newProduct.images.length}</small>
                        <div className="preview-thumbs">
                          {newProduct.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="mini-thumb" />
                          ))}
                        </div>
                        <button type="button" className="btn-text btn-sm" onClick={() => setNewProduct({...newProduct, images: []})}>Clear all</button>
                      </div>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isUploading}>
                      {isUploading ? 'Uploading...' : (editingId ? 'Update Product' : 'Create Product')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Retail / MRP</th>
                  <th>Wholesale</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td><img src={product.image_url} alt="" className="table-img" /></td>
                    <td>{product.title}</td>
                    <td>{product.category}</td>
                    <td>
                      <div>₹{product.price}</div>
                      <small style={{ textDecoration: 'line-through', color: '#999' }}>₹{product.original_price || product.price}</small>
                    </td>
                    <td>₹{product.wholesale_price}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <div className="actions">
                        <button className="action-btn edit" onClick={() => openEditModal(product)}><Edit size={16} /></button>
                        <button className="action-btn delete" onClick={() => deleteProduct(product.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-content animate-fade-in">
          <h2>Order History</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id.slice(0, 8)}</td>
                  <td>{order.customer_name}<br/><small>{order.customer_email}</small></td>
                  <td>₹{order.total_amount}</td>
                  <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="5">No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
