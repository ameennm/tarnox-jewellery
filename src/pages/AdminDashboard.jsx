import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  CreditCard,
  Edit,
  Image as ImageIcon,
  Layers3,
  MessageCircle,
  Minus,
  MousePointerClick,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  UploadCloud,
  Users
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import {
  archiveProduct,
  archiveCategory,
  createCategory,
  createProduct,
  getCategories,
  getOrders,
  getProducts,
  getAnalyticsSummary,
  updateCategory,
  updateOrder,
  updateOrderItemQuantity,
  updateProduct,
  uploadImage
} from '../lib/api';
import './AdminDashboard.css';

const emptyProduct = {
  title: '',
  category: '',
  description: '',
  price: '',
  original_price: '',
  wholesale_price: '',
  stock_quantity: '',
  images: ''
};

const emptyCategory = {
  name: '',
  image_url: '',
  display_order: ''
};

const orderStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'completed', 'cancelled', 'stock_review'];

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format(value || 0);

const toPercent = (value, max) => {
  if (!max) return 50;
  return Math.min(96, Math.max(4, (Number(value || 0) / Number(max)) * 100));
};

const heatDotSize = (count) => Math.min(34, 10 + Number(count || 0) * 4);
const imageAcceptTypes = '.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp';

const splitCsvLine = (line) => {
  const delimiter = line.includes('\t') ? '\t' : ',';
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
};

const parseBulkProducts = (rows, fallbackCategory) => rows
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const cells = splitCsvLine(line);
    const hasCategory = cells.length >= 7 || fallbackCategory === 'All';
    const [title, categoryOrPrice, priceOrMrp, mrpOrWholesale, wholesaleOrStock, stockOrImage, imageOrRest] = cells;
    const category = hasCategory ? categoryOrPrice : fallbackCategory;
    const price = hasCategory ? priceOrMrp : categoryOrPrice;
    const originalPrice = hasCategory ? mrpOrWholesale : priceOrMrp;
    const wholesalePrice = hasCategory ? wholesaleOrStock : mrpOrWholesale;
    const stockQuantity = hasCategory ? stockOrImage : wholesaleOrStock;
    const imageValue = hasCategory ? imageOrRest : stockOrImage;

    return {
      title,
      category,
      price,
      original_price: originalPrice || price,
      wholesale_price: wholesalePrice || price,
      stock_quantity: stockQuantity || 0,
      images: imageValue ? imageValue.split('|').map((image) => image.trim()).filter(Boolean) : []
    };
  });

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoryStep, setCategoryStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [bulkRows, setBulkRows] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const { logout } = useAdmin();

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productResult, orderResult, categoryResult] = await Promise.all([
        getProducts({ includeInactive: true, limit: 200 }),
        getOrders({ limit: 200 }),
        getCategories({ includeInactive: true }).catch(() => ({ categories: [] }))
      ]);
      const analyticsResult = await getAnalyticsSummary({ days: 7 }).catch(() => null);
      setProducts(productResult.products || []);
      setOrders(orderResult.orders || []);
      setCategories(categoryResult.categories || []);
      setAnalytics(analyticsResult);
    } catch (err) {
      setError(err.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeProducts = products.filter((product) => product.is_active);

  const categoryCounts = useMemo(() => activeProducts.reduce((summary, product) => {
    const name = product.category?.trim();
    if (!name) return summary;
    const existing = summary.get(name) || { product_count: 0, stock_count: 0 };
    summary.set(name, {
      product_count: existing.product_count + 1,
      stock_count: existing.stock_count + Number(product.stock_quantity || 0)
    });
    return summary;
  }, new Map()), [activeProducts]);

  const categoryOptions = useMemo(() => {
    const options = new Map();
    categories
      .filter((categoryItem) => categoryItem.is_active)
      .forEach((categoryItem) => options.set(categoryItem.name, categoryItem));

    activeProducts.forEach((product) => {
      const name = product.category?.trim();
      if (name && !options.has(name)) {
        options.set(name, {
          id: `product-category-${name}`,
          name,
          image_url: '',
          display_order: 0,
          is_active: true
        });
      }
    });

    return Array.from(options.values())
      .map((categoryItem) => ({
        ...categoryItem,
        ...(categoryCounts.get(categoryItem.name) || { product_count: 0, stock_count: 0 })
      }))
      .sort((a, b) => (a.display_order - b.display_order) || a.name.localeCompare(b.name));
  }, [categories, activeProducts, categoryCounts]);

  useEffect(() => {
    if (selectedCategory !== 'All' && !categoryOptions.some((categoryItem) => categoryItem.name === selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categoryOptions, selectedCategory]);

  const visibleProducts = selectedCategory === 'All'
    ? activeProducts
    : activeProducts.filter((product) => product.category?.trim() === selectedCategory);

  const selectedCategoryMeta = selectedCategory === 'All'
    ? {
      name: 'All categories',
      product_count: activeProducts.length,
      stock_count: activeProducts.reduce((total, product) => total + Number(product.stock_quantity || 0), 0)
    }
    : categoryOptions.find((categoryItem) => categoryItem.name === selectedCategory);

  const filteredProducts = visibleProducts.filter((product) => {
    const term = searchTerm.toLowerCase();
    return product.title.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
  });

  const metrics = useMemo(() => {
    const liveOrders = orders.filter((order) => order.status !== 'cancelled');
    const revenue = liveOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0);
    const customers = new Set(liveOrders.map((order) => order.customer_phone).filter(Boolean)).size;
    const lowStock = activeProducts.filter((product) => Number(product.stock_quantity || 0) <= 5).length;

    return { revenue, customers, lowStock };
  }, [orders, activeProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      ...emptyProduct,
      category: selectedCategory !== 'All' ? selectedCategory : (categoryOptions[0]?.name || '')
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price || '',
      original_price: product.original_price || product.price || '',
      wholesale_price: product.wholesale_price || product.price || '',
      stock_quantity: product.stock_quantity || 0,
      images: (product.images || []).join('\n')
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProduct);
  };

  const updateProductForm = (field, value) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (categoryItem) => {
    setEditingCategory(categoryItem.id?.startsWith('product-category-') ? null : categoryItem);
    setCategoryForm({
      name: categoryItem.name || '',
      image_url: categoryItem.image_url || '',
      display_order: categoryItem.display_order || 0
    });
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
  };

  const updateCategoryForm = (field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
  };

  const handleProductImageFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingProductImages(true);
    setError('');
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const result = await uploadImage(file, 'products');
        uploadedUrls.push(result.url);
      }

      setProductForm((current) => {
        const currentImages = current.images
          .split('\n')
          .map((image) => image.trim())
          .filter(Boolean);
        return {
          ...current,
          images: [...currentImages, ...uploadedUrls].join('\n')
        };
      });
    } catch (err) {
      setError(err.message || 'Unable to upload product image');
    } finally {
      setUploadingProductImages(false);
      event.target.value = '';
    }
  };

  const handleCategoryImageFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCategoryImage(true);
    setError('');
    try {
      const result = await uploadImage(file, 'categories');
      const nextCategoryForm = { ...categoryForm, image_url: result.url };
      setCategoryForm(nextCategoryForm);

      if (editingCategory?.id && !editingCategory.id.startsWith('product-category-')) {
        const saved = await updateCategory(editingCategory.id, nextCategoryForm);
        setEditingCategory(saved.category || editingCategory);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Unable to upload category image');
    } finally {
      setUploadingCategoryImage(false);
      event.target.value = '';
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...productForm,
      images: productForm.images
        .split('\n')
        .map((image) => image.trim())
        .filter(Boolean)
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      closeModal();
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const result = editingCategory
        ? await updateCategory(editingCategory.id, categoryForm)
        : await createCategory(categoryForm);
      const nextCategory = result.category?.name || categoryForm.name;
      closeCategoryModal();
      setSelectedCategory(nextCategory);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save category');
    } finally {
      setSaving(false);
    }
  };

  const adjustProductStock = async (product, delta) => {
    const nextStock = Math.max(0, Number(product.stock_quantity || 0) + delta);
    await updateProduct(product.id, { stock_quantity: nextStock });
    await loadData();
  };

  const adjustCategoryStock = async (delta) => {
    if (selectedCategory === 'All') return;

    const targets = activeProducts.filter((product) => product.category?.trim() === selectedCategory);
    if (targets.length === 0) return;

    setSaving(true);
    setError('');
    try {
      await Promise.all(targets.map((product) => updateProduct(product.id, {
        stock_quantity: Math.max(0, Number(product.stock_quantity || 0) + delta)
      })));
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to update category stock');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveProduct = async (product) => {
    if (!window.confirm(`Archive ${product.title}? This is a soft archive, not a database delete.`)) return;
    await archiveProduct(product.id);
    await loadData();
  };

  const handleArchiveCategory = async (categoryItem) => {
    if (!categoryItem.id || categoryItem.id.startsWith('product-category-')) return;
    if (!window.confirm(`Archive ${categoryItem.name}? Products will stay in the database.`)) return;
    await archiveCategory(categoryItem.id);
    closeCategoryModal();
    setSelectedCategory('All');
    await loadData();
  };

  const openBulkModal = () => {
    setBulkRows('');
    setIsBulkModalOpen(true);
  };

  const saveBulkProducts = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const rows = parseBulkProducts(bulkRows, selectedCategory);
      const validRows = rows.filter((row) => row.title && row.category && Number(row.price) > 0);
      if (validRows.length === 0) throw new Error('Add at least one valid product row');

      for (const product of validRows) {
        await createProduct(product);
      }

      setIsBulkModalOpen(false);
      setBulkRows('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to upload products');
    } finally {
      setSaving(false);
    }
  };

  const handleOrderStatus = async (order, status) => {
    await updateOrder(order.id, { status });
    await loadData();
  };

  const handlePaymentStatus = async (order, paymentStatus) => {
    await updateOrder(order.id, { payment_status: paymentStatus });
    await loadData();
  };

  const adjustOrderItem = async (order, item, delta) => {
    const nextQuantity = Math.max(1, Number(item.quantity || 1) + delta);
    await updateOrderItemQuantity(order.id, item.id, nextQuantity);
    await loadData();
  };

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <div>
          <p className="admin-eyebrow">Cloudflare Commerce</p>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-header-actions">
          <button className="icon-action" onClick={loadData} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => logout()}>Logout</button>
          <div className="admin-tabs">
            <button
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package size={16} />
              <span>Products</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart size={16} />
              <span>Orders</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <Package size={24} />
          <div>
            <h3>{activeProducts.length}</h3>
            <p>Active products</p>
          </div>
        </div>
        <div className="stat-card">
          <ShoppingCart size={24} />
          <div>
            <h3>{orders.length}</h3>
            <p>Total orders</p>
          </div>
        </div>
        <div className="stat-card">
          <Users size={24} />
          <div>
            <h3>{metrics.customers}</h3>
            <p>Known customers</p>
          </div>
        </div>
        <div className="stat-card warning">
          <Package size={24} />
          <div>
            <h3>{metrics.lowStock}</h3>
            <p>Low stock items</p>
          </div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {activeTab === 'products' ? (
        <section className="admin-content">
          <div className="content-header">
            <div>
              <h2>Inventory</h2>
              <p>Pick a category, then adjust stock with thumb-friendly controls.</p>
            </div>
            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={18} />
                <input
                  placeholder="Search products"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={18} /> Add Product
              </button>
            </div>
          </div>

          <div className="category-workbench">
            <div className="category-strip" aria-label="Product categories">
              <button
                className={`category-chip ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                <span className="category-thumb"><Layers3 size={18} /></span>
                <span>All</span>
                <strong>{activeProducts.length}</strong>
              </button>
              {categoryOptions.map((categoryItem) => (
                <button
                  key={categoryItem.name}
                  className={`category-chip ${selectedCategory === categoryItem.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(categoryItem.name)}
                >
                  <span className="category-thumb">
                    {categoryItem.image_url ? (
                      <img src={categoryItem.image_url} alt="" />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                  </span>
                  <span>{categoryItem.name}</span>
                  <strong>{categoryItem.product_count || 0}</strong>
                </button>
              ))}
              <button className="category-chip create" onClick={openCreateCategoryModal}>
                <span className="category-thumb"><Plus size={18} /></span>
                <span>New</span>
              </button>
            </div>

            <div className="category-control-card">
              <div className="category-control-summary">
                <span>{selectedCategoryMeta?.name || selectedCategory}</span>
                <strong>{selectedCategoryMeta?.product_count || 0} items · {selectedCategoryMeta?.stock_count || 0} total stock</strong>
              </div>

              <div className="category-stock-tool">
                <button
                  type="button"
                  onClick={() => adjustCategoryStock(-categoryStep)}
                  disabled={selectedCategory === 'All' || saving}
                >
                  <Minus size={16} />
                  <span>{categoryStep}</span>
                </button>
                <label>
                  <span>Step</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={categoryStep}
                    onChange={(event) => setCategoryStep(Math.max(1, parseInt(event.target.value, 10) || 1))}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => adjustCategoryStock(categoryStep)}
                  disabled={selectedCategory === 'All' || saving}
                >
                  <Plus size={16} />
                  <span>{categoryStep}</span>
                </button>
              </div>

              <div className="category-control-actions">
                <button className="btn btn-outline btn-sm" onClick={openBulkModal}>
                  <UploadCloud size={16} /> Bulk Add
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const categoryToEdit = categoryOptions.find((item) => item.name === selectedCategory);
                    if (categoryToEdit) openEditCategoryModal(categoryToEdit);
                  }}
                  disabled={selectedCategory === 'All'}
                >
                  <Edit size={16} /> Edit Category
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="admin-empty">Loading inventory...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="admin-empty">No products found.</div>
          ) : (
            <div className="inventory-grid">
              {filteredProducts.map((product) => (
                <article key={product.id} className="inventory-card">
                  <div className="inventory-image">
                    {product.image_url ? <img src={product.image_url} alt={product.title} /> : <span>Tarnox</span>}
                  </div>
                  <div className="inventory-info">
                    <p className="inventory-category">{product.category || 'Uncategorized'}</p>
                    <h3>{product.title}</h3>
                    <p className="inventory-price">
                      {formatCurrency(product.price)}
                      {product.original_price > product.price && <span>{formatCurrency(product.original_price)}</span>}
                    </p>
                  </div>
                  <div className={`stock-control ${product.stock_quantity <= 5 ? 'low' : ''}`}>
                    <button onClick={() => adjustProductStock(product, -1)} disabled={product.stock_quantity <= 0}>
                      <Minus size={15} />
                    </button>
                    <div>
                      <strong>{product.stock_quantity}</strong>
                      <small>in stock</small>
                    </div>
                    <button onClick={() => adjustProductStock(product, 1)}>
                      <Plus size={15} />
                    </button>
                  </div>
                  <div className="inventory-actions">
                    <button className="icon-action" onClick={() => openEditModal(product)} title="Edit product">
                      <Edit size={16} />
                    </button>
                    <button className="icon-action danger" onClick={() => handleArchiveProduct(product)} title="Archive product">
                      <Archive size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : activeTab === 'orders' ? (
        <section className="admin-content">
          <div className="content-header">
            <div>
              <h2>Orders</h2>
              <p>Adjust item quantities without opening spreadsheets.</p>
            </div>
            <strong className="revenue-pill">{formatCurrency(metrics.revenue)} live revenue</strong>
          </div>

          {loading ? (
            <div className="admin-empty">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="admin-empty">No orders yet.</div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-main">
                    <div>
                      <p className="order-number">{order.order_number}</p>
                      <h3>{order.customer_name}</h3>
                      <p>{order.customer_phone}{order.customer_email ? ` · ${order.customer_email}` : ''}</p>
                    </div>
                    <div className="order-summary">
                      <strong>{formatCurrency(order.total_amount)}</strong>
                      <select value={order.status} onChange={(event) => handleOrderStatus(order, event.target.value)}>
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                      <select value={order.payment_status || 'unpaid'} onChange={(event) => handlePaymentStatus(order, event.target.value)}>
                        <option value="unpaid">unpaid</option>
                        <option value="paid">paid</option>
                        <option value="refunded">refunded</option>
                      </select>
                    </div>
                  </div>

                  {order.customer_address && <p className="order-address">{order.customer_address}</p>}
                  {order.notes && <p className="order-note">{order.notes}</p>}

                  <div className="order-items">
                    {order.items.map((item) => (
                      <div key={item.id} className="order-item-row">
                        <div>
                          <strong>{item.title}</strong>
                          <span>{formatCurrency(item.unit_price)} each</span>
                        </div>
                        <div className="order-qty-control">
                          <button onClick={() => adjustOrderItem(order, item, -1)} disabled={item.quantity <= 1 || order.status === 'cancelled'}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => adjustOrderItem(order, item, 1)} disabled={order.status === 'cancelled'}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <strong>{formatCurrency(item.line_total)}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="admin-content">
          <div className="content-header">
            <div>
              <h2>Sales Analytics</h2>
              <p>Visitor behavior, checkout intent, WhatsApp follow-through, and missed leads from the last 7 days.</p>
            </div>
            <strong className="revenue-pill">{analytics ? formatCurrency(analytics.summary.live_revenue) : formatCurrency(0)} live revenue</strong>
          </div>

          {!analytics ? (
            <div className="admin-empty">Analytics will appear after Cloudflare D1 is connected and events start coming in.</div>
          ) : (
            <>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <BarChart3 size={22} />
                  <span>Visitors</span>
                  <strong>{analytics.summary.visitors}</strong>
                </div>
                <div className="analytics-card">
                  <MousePointerClick size={22} />
                  <span>Page views</span>
                  <strong>{analytics.summary.page_views}</strong>
                </div>
                <div className="analytics-card">
                  <ShoppingCart size={22} />
                  <span>Checkout starts</span>
                  <strong>{analytics.summary.checkout_starts}</strong>
                </div>
                <div className="analytics-card">
                  <Package size={22} />
                  <span>Orders created</span>
                  <strong>{analytics.summary.orders_created}</strong>
                </div>
                <div className="analytics-card warning">
                  <CreditCard size={22} />
                  <span>Unpaid orders</span>
                  <strong>{analytics.summary.unpaid_orders}</strong>
                </div>
                <div className="analytics-card">
                  <MessageCircle size={22} />
                  <span>WhatsApp clicks</span>
                  <strong>{analytics.summary.whatsapp_clicks}</strong>
                </div>
              </div>

              <div className="analytics-panels">
                <div className="analytics-panel">
                  <h3>Top Pages</h3>
                  {analytics.top_pages.length === 0 ? (
                    <p>No page views yet.</p>
                  ) : analytics.top_pages.map((page) => (
                    <div className="analytics-row" key={page.path}>
                      <span>{page.path}</span>
                      <strong>{page.count}</strong>
                    </div>
                  ))}
                </div>

                <div className="analytics-panel">
                  <h3>Checkout Funnel</h3>
                  {['page_view', 'add_to_cart', 'checkout_started', 'order_created', 'whatsapp_click'].map((eventType) => {
                    const event = analytics.funnel.find((item) => item.event_type === eventType);
                    return (
                      <div className="analytics-row" key={eventType}>
                        <span>{eventType.replaceAll('_', ' ')}</span>
                        <strong>{event?.count || 0}</strong>
                      </div>
                    );
                  })}
                </div>

                <div className="analytics-panel wide">
                  <h3>Missed WhatsApp Leads</h3>
                  {analytics.missed_whatsapp_leads.length === 0 ? (
                    <p>No missed WhatsApp follow-ups in this range.</p>
                  ) : analytics.missed_whatsapp_leads.map((lead) => (
                    <div className="lead-row" key={lead.id}>
                      <div>
                        <strong>{lead.customer_name}</strong>
                        <span>{lead.customer_phone}{lead.customer_email ? ` · ${lead.customer_email}` : ''}</span>
                      </div>
                      <div>
                        <span>{lead.order_number}</span>
                        <strong>{formatCurrency(lead.total_amount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="analytics-panel wide">
                  <h3>Heat Map Signals</h3>
                  {analytics.heatmap.length === 0 ? (
                    <p>No click heatmap data yet.</p>
                  ) : (
                    <>
                      <div className="heatmap-board" aria-label="Click heatmap">
                        {analytics.heatmap.slice(0, 40).map((point, index) => {
                          const size = heatDotSize(point.count);
                          return (
                            <span
                              className="heat-dot"
                              key={`${point.path}-${point.x}-${point.y}-${index}`}
                              title={`${point.path}: ${point.count} clicks`}
                              style={{
                                left: `${toPercent(point.x, point.viewport_width)}%`,
                                top: `${toPercent(point.y, point.viewport_height)}%`,
                                width: `${size}px`,
                                height: `${size}px`
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="heatmap-list">
                        {analytics.heatmap.slice(0, 12).map((point, index) => (
                          <div className="heatmap-point" key={`${point.path}-${point.x}-${point.y}-${index}`}>
                            <span>{point.path}</span>
                            <strong>{point.count} clicks</strong>
                            <small>x{point.x} · y{point.y}</small>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal product-modal">
            <div className="modal-title-row">
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="icon-action" type="button" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={saveProduct} className="product-form">
              <label>
                Title
                <input required value={productForm.title} onChange={(event) => updateProductForm('title', event.target.value)} />
              </label>
              <label>
                Category
                <select required value={productForm.category} onChange={(event) => updateProductForm('category', event.target.value)}>
                  <option value="">Select category</option>
                  {categoryOptions.map((categoryItem) => (
                    <option key={categoryItem.name} value={categoryItem.name}>{categoryItem.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <textarea rows="3" value={productForm.description} onChange={(event) => updateProductForm('description', event.target.value)} />
              </label>
              <div className="form-grid">
                <label>
                  Retail Price
                  <input type="number" min="0" step="0.01" required value={productForm.price} onChange={(event) => updateProductForm('price', event.target.value)} />
                </label>
                <label>
                  MRP
                  <input type="number" min="0" step="0.01" value={productForm.original_price} onChange={(event) => updateProductForm('original_price', event.target.value)} />
                </label>
                <label>
                  Wholesale Price
                  <input type="number" min="0" step="0.01" value={productForm.wholesale_price} onChange={(event) => updateProductForm('wholesale_price', event.target.value)} />
                </label>
                <label>
                  Stock Quantity
                  <input type="number" min="0" required value={productForm.stock_quantity} onChange={(event) => updateProductForm('stock_quantity', event.target.value)} />
                </label>
              </div>
              <div className="upload-panel">
                <label className="file-upload-button">
                  <UploadCloud size={18} />
                  <span>{uploadingProductImages ? 'Uploading...' : 'Upload Product Images'}</span>
                  <input
                    type="file"
                    accept={imageAcceptTypes}
                    multiple
                    onChange={handleProductImageFiles}
                    disabled={uploadingProductImages}
                  />
                </label>
                <small>Choose one or more images from mobile or desktop.</small>
              </div>
              <label>
                Image URLs
                <textarea
                  rows="4"
                  placeholder="One image URL per line"
                  value={productForm.images}
                  onChange={(event) => updateProductForm('images', event.target.value)}
                />
              </label>
              {productForm.images && (
                <div className="image-preview-list">
                  {productForm.images.split('\n').map((image) => image.trim()).filter(Boolean).slice(0, 4).map((image) => (
                    <img key={image} src={image} alt="" />
                  ))}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal category-modal">
            <div className="modal-title-row">
              <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              <button className="icon-action" type="button" onClick={closeCategoryModal}>×</button>
            </div>
            <form onSubmit={saveCategory} className="product-form">
              <label>
                Category Name
                <input required value={categoryForm.name} onChange={(event) => updateCategoryForm('name', event.target.value)} />
              </label>
              <div className="upload-panel">
                <label className="file-upload-button">
                  <UploadCloud size={18} />
                  <span>{uploadingCategoryImage ? 'Uploading...' : 'Upload Category Image'}</span>
                  <input
                    type="file"
                    accept={imageAcceptTypes}
                    onChange={handleCategoryImageFile}
                    disabled={uploadingCategoryImage}
                  />
                </label>
                <small>The uploaded image URL will be filled below.</small>
              </div>
              <label>
                Category Image URL
                <input value={categoryForm.image_url} onChange={(event) => updateCategoryForm('image_url', event.target.value)} />
              </label>
              {categoryForm.image_url && (
                <div className="category-image-preview">
                  <img src={categoryForm.image_url} alt="" />
                </div>
              )}
              <label>
                Display Order
                <input type="number" value={categoryForm.display_order} onChange={(event) => updateCategoryForm('display_order', event.target.value)} />
              </label>
              <div className="modal-actions split-actions">
                {editingCategory && (
                  <button type="button" className="btn btn-outline danger-btn" onClick={() => handleArchiveCategory(editingCategory)}>
                    <Archive size={16} /> Archive
                  </button>
                )}
                <div className="modal-actions-right">
                  <button type="button" className="btn btn-outline" onClick={closeCategoryModal}>Cancel</button>
                  <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Category'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal product-modal">
            <div className="modal-title-row">
              <h2>Bulk Add Products</h2>
              <button className="icon-action" type="button" onClick={() => setIsBulkModalOpen(false)}>×</button>
            </div>
            <form onSubmit={saveBulkProducts} className="product-form">
              <label>
                Product Rows
                <textarea
                  rows="9"
                  placeholder={selectedCategory === 'All'
                    ? 'Title, Category, Price, MRP, Wholesale, Stock, Image URL'
                    : 'Title, Price, MRP, Wholesale, Stock, Image URL'}
                  value={bulkRows}
                  onChange={(event) => setBulkRows(event.target.value)}
                />
              </label>
              <p className="bulk-note">
                {selectedCategory === 'All'
                  ? 'Paste one comma or tab separated product per line.'
                  : `Rows will be added to ${selectedCategory} unless a category column is included.`}
              </p>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsBulkModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Uploading...' : 'Upload Products'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
