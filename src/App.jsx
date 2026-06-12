import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AdminProvider } from './contexts/AdminContext';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingCart from './components/FloatingCart';
import AnalyticsTracker from './components/AnalyticsTracker';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import AboutPage from './pages/AboutPage';
import WholesalePage from './pages/WholesalePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const AppShell = () => {
  const location = useLocation();
  const isAdminSurface = location.pathname.startsWith('/admin') || location.pathname === '/login';

  return (
    <div className={`app-container ${isAdminSurface ? 'admin-surface' : ''}`}>
      <ScrollToTop />
      <AnalyticsTracker />
      {!isAdminSurface && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/wholesale" element={<WholesalePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isAdminSurface && <FloatingCart />}
      {!isAdminSurface && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AdminProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AdminProvider>
    </Router>
  );
}

export default App;
