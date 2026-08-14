import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Landmark, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let errors = { ...fieldErrors };

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          errors.fullName = 'Full Name is required';
        } else {
          delete errors.fullName;
        }
        break;
      case 'username':
        if (!value.trim()) {
          errors.username = 'Username is required';
        } else if (value.trim().length < 3) {
          errors.username = 'Username must be at least 3 characters';
        } else {
          delete errors.username;
        }
        break;
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      case 'phone':
        if (value && !/^[0-9]{10}$/.test(value.trim())) {
          errors.phone = 'Phone number must be exactly 10 digits';
        } else {
          delete errors.phone;
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else {
          delete errors.password;
        }
        break;
      default:
        break;
    }

    setFieldErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validateAll = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateAll()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created successfully!');
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') {
        setError(data);
      } else if (data?.message) {
        setError(data.message);
      } else if (data?.error) {
        setError(data.error);
      } else if (typeof data === 'object') {
        setError(Object.values(data).join(', '));
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#243044', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Compact Top Brand Logo */}
      <div style={{ width: '100%', maxWidth: '480px', marginBottom: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'transparent', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <Landmark size={20} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#FFFFFF' }}>
            APEX BANK
          </span>
        </div>
      </div>

      {/* Perfectly Proportioned Card (Fits Whole Screen without Scrolling) */}
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#1E232D', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '24px 32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)' }}>
        
        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', margin: '0 0 4px 0' }}>
            Create Account
          </h1>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0' }}>
            Open your digital banking account in seconds
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ shrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ shrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Full Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
              Full Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              name="fullName"
              style={{ display: 'block', width: '100%', height: '38px', padding: '0 14px', backgroundColor: '#2B3546', border: fieldErrors.fullName ? '1px solid #EF4444' : '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={handleChange}
            />
            {fieldErrors.fullName && (
              <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500', margin: '2px 0 0 0' }}>⚠️ {fieldErrors.fullName}</p>
            )}
          </div>

          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
              Username (min 3 chars) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              name="username"
              style={{ display: 'block', width: '100%', height: '38px', padding: '0 14px', backgroundColor: '#2B3546', border: fieldErrors.username ? '1px solid #EF4444' : '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. johndoe"
              value={formData.username}
              onChange={handleChange}
            />
            {fieldErrors.username && (
              <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500', margin: '2px 0 0 0' }}>⚠️ {fieldErrors.username}</p>
            )}
          </div>

          {/* Email Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
              Email Address <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              style={{ display: 'block', width: '100%', height: '38px', padding: '0 14px', backgroundColor: '#2B3546', border: fieldErrors.email ? '1px solid #EF4444' : '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && (
              <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500', margin: '2px 0 0 0' }}>⚠️ {fieldErrors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
              Phone Number (10 digits)
            </label>
            <input
              type="text"
              name="phone"
              style={{ display: 'block', width: '100%', height: '38px', padding: '0 14px', backgroundColor: '#2B3546', border: fieldErrors.phone ? '1px solid #EF4444' : '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
            />
            {fieldErrors.phone && (
              <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500', margin: '2px 0 0 0' }}>⚠️ {fieldErrors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
              Password (min 6 chars) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                style={{ display: 'block', width: '100%', height: '38px', padding: '0 40px 0 14px', backgroundColor: '#2B3546', border: fieldErrors.password ? '1px solid #EF4444' : '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500', margin: '2px 0 0 0' }}>⚠️ {fieldErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ paddingTop: '4px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: '42px', backgroundColor: '#0F4C81', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </div>
        </form>

        {/* Login Redirect */}
        <div style={{ textAlign: 'center', paddingTop: '12px', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 'bold' }}>
              Sign In Here
            </Link>
          </p>
        </div>
      </div>

      {/* Compact Footer */}
      <footer style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <ShieldCheck size={14} style={{ color: '#10B981' }} />
        <span>Secure banking powered by Apex Bank</span>
      </footer>
    </div>
  );
};

export default Register;
