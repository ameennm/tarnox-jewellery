import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { Lock, Mail } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAdmin();
  const navigate = useNavigate();

  if (isAdmin) {
    return <Navigate to="/admin" />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { success, error } = login(password);
    
    if (!success) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="login-page container">
      <div className="login-card glass-morphism animate-fade-in">
        <div className="login-header">
          <div className="lock-icon">
            <Lock size={32} />
          </div>
          <h1>Admin Access</h1>
          <p>Please enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Admin Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Unlock Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
