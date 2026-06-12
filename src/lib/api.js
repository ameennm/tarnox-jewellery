async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers,
    body: hasBody && !isFormData && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong');
  }
  return payload;
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export function getProducts(params = {}) {
  return apiFetch(`/api/products${queryString(params)}`);
}

export function createProduct(product) {
  return apiFetch('/api/products', {
    method: 'POST',
    body: product
  });
}

export function updateProduct(id, product) {
  return apiFetch(`/api/products/${id}`, {
    method: 'PATCH',
    body: product
  });
}

export function archiveProduct(id) {
  return apiFetch(`/api/products/${id}`, {
    method: 'DELETE'
  });
}

export function getCategories(params = {}) {
  return apiFetch(`/api/categories${queryString(params)}`);
}

export function createCategory(category) {
  return apiFetch('/api/categories', {
    method: 'POST',
    body: category
  });
}

export function updateCategory(id, category) {
  return apiFetch(`/api/categories/${id}`, {
    method: 'PATCH',
    body: category
  });
}

export function archiveCategory(id) {
  return apiFetch(`/api/categories/${id}`, {
    method: 'DELETE'
  });
}

export function uploadImage(file, folder = 'products') {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('folder', folder);

  return apiFetch('/api/uploads/images', {
    method: 'POST',
    body: formData
  });
}

export function createOrder(order) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: order
  });
}

export function getOrders(params = {}) {
  return apiFetch(`/api/orders${queryString(params)}`);
}

export function updateOrder(id, patch) {
  return apiFetch(`/api/orders/${id}`, {
    method: 'PATCH',
    body: patch
  });
}

export function updateOrderItemQuantity(orderId, itemId, quantity) {
  return apiFetch(`/api/orders/${orderId}/items/${itemId}`, {
    method: 'PATCH',
    body: { quantity }
  });
}

export function loginAdmin(password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { password }
  });
}

export function logoutAdmin() {
  return apiFetch('/api/auth/logout', {
    method: 'POST'
  });
}

export function getAdminSession() {
  return apiFetch('/api/auth/session');
}

export function trackEvent(event) {
  return apiFetch('/api/analytics/events', {
    method: 'POST',
    keepalive: true,
    body: event
  }).catch(() => ({ ok: false }));
}

export function getAnalyticsSummary(params = {}) {
  return apiFetch(`/api/analytics/summary${queryString(params)}`);
}
