import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Landmark, Eye, EyeOff, ShieldCheck, AlertCircle, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot Password Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [receivedOtpHint, setReceivedOtpHint] = useState('');

  const { login, forgotPassword, verifyOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!emailOrUsername.trim()) {
      errors.emailOrUsername = 'Email or Username is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const extractErrorMessage = (err, fallback) => {
    const data = err.response?.data;
    if (!data) return err.message || fallback;
    if (typeof data === 'string') return data;
    if (data.message && typeof data.message === 'string') return data.message;
    if (data.error && typeof data.error === 'string') return data.error;
    return fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      toast.error('Please enter valid credentials');
      return;
    }

    setLoading(true);
    try {
      const user = await login(emailOrUsername, password);
      const name = user?.fullName || user?.username || 'User';
      toast.success(`Welcome back, ${name}!`);
      const role = user?.role;
      if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid username/email or password'));
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!resetEmail.trim()) {
      setModalError('Please enter your registered Email or Username');
      return;
    }

    setModalLoading(true);
    try {
      const res = await forgotPassword(resetEmail.trim());
      toast.success('OTP sent to your email!');
      
      // Extract OTP hint if returned for testing ease
      if (res.message && res.message.includes('OTP Code:')) {
        const extracted = res.message.split('OTP Code:')[1].replace(')', '').trim();
        setReceivedOtpHint(extracted);
      }
      setModalStep(2);
    } catch (err) {
      setModalError(extractErrorMessage(err, 'Account not found for this email/username'));
    } finally {
      setModalLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!otpToken.trim()) {
      setModalError('Please enter the 6-digit OTP code');
      return;
    }

    setModalLoading(true);
    try {
      await verifyOtp(resetEmail.trim(), otpToken.trim());
      toast.success('OTP Verified!');
      setModalStep(3);
    } catch (err) {
      setModalError(extractErrorMessage(err, 'Invalid or expired OTP code'));
    } finally {
      setModalLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newPassword || newPassword.length < 6) {
      setModalError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError('Passwords do not match');
      return;
    }

    setModalLoading(true);
    try {
      await resetPassword(resetEmail.trim(), otpToken.trim(), newPassword);
      toast.success('Password updated successfully! You can now sign in.');
      setShowModal(false);
      setModalStep(1);
      setResetEmail('');
      setOtpToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setModalError(extractErrorMessage(err, 'Password reset failed'));
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStep(1);
    setModalError('');
    setResetEmail('');
    setOtpToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#243044', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Compact Top Brand Logo */}
      <div style={{ width: '100%', maxWidth: '440px', marginBottom: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'transparent', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <Landmark size={20} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#FFFFFF' }}>
            APEX BANK
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: '500', letterSpacing: '0.05em', marginTop: '4px' }}>Digital Banking System</p>
      </div>

      {/* Screen-Fit Centered Card Container */}
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#1E232D', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '32px 32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)' }}>
        
        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF', margin: '0 0 4px 0' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0' }}>
            Sign in to access your digital banking account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ shrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Email or Username Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
              Email or Username
            </label>
            <input
              type="text"
              style={{ display: 'block', width: '100%', height: '42px', padding: '0 14px', backgroundColor: '#2B3546', border: fieldErrors.emailOrUsername ? '1px solid #EF4444' : '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Email or username"
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                if (fieldErrors.emailOrUsername) setFieldErrors({ ...fieldErrors, emailOrUsername: null });
              }}
            />
            {fieldErrors.emailOrUsername && (
              <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500', margin: '2px 0 0 0' }}>⚠️ {fieldErrors.emailOrUsername}</p>
            )}
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setShowModal(true);
                }}
                style={{ fontSize: '11px', color: '#60A5FA', textDecoration: 'none', fontWeight: '500', cursor: 'pointer' }}
              >
                Forgot password?
              </a>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={{ display: 'block', width: '100%', height: '42px', padding: '0 40px 0 14px', backgroundColor: '#2B3546', border: fieldErrors.password ? '1px solid #EF4444' : '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                }}
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

          {/* Sign In Button */}
          <div style={{ paddingTop: '4px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: '44px', backgroundColor: '#0F4C81', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Register Link */}
        <div style={{ textAlign: 'center', paddingTop: '16px', marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 'bold' }}>
              Register Account
            </Link>
          </p>
        </div>
      </div>

      {/* Compact Footer */}
      <footer style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <ShieldCheck size={14} style={{ color: '#10B981' }} />
        <span>Secure banking powered by Apex Bank</span>
      </footer>

      {/* 3-STEP FORGOT PASSWORD MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#1E232D', border: '1px solid #374151', borderRadius: '16px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(96, 165, 250, 0.15)', border: '1px solid rgba(96, 165, 250, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>Reset Password</h3>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                  {modalStep === 1 && 'Step 1 of 3: Request OTP'}
                  {modalStep === 2 && 'Step 2 of 3: Verify OTP Code'}
                  {modalStep === 3 && 'Step 3 of 3: Set New Password'}
                </p>
              </div>
            </div>

            {/* Modal Alert Error */}
            {modalError && (
              <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ shrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            {/* STEP 1: Enter Email or Username */}
            {modalStep === 1 && (
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Email or Username
                  </label>
                  <input
                    type="text"
                    style={{ display: 'block', width: '100%', height: '42px', padding: '0 14px', backgroundColor: '#2B3546', border: '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Enter registered email or username"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{ height: '38px', padding: '0 16px', backgroundColor: 'transparent', border: '1px solid #475569', borderRadius: '8px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    style={{ height: '38px', padding: '0 20px', backgroundColor: '#0F4C81', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {modalLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter 6-Digit OTP */}
            {modalStep === 2 && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', color: '#60A5FA', fontSize: '12px', fontWeight: '500', textAlign: 'center' }}>
                  📧 OTP code sent to <strong>{resetEmail}</strong>. Please check your inbox.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    style={{ display: 'block', width: '100%', height: '44px', padding: '0 14px', backgroundColor: '#2B3546', border: '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.25em', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="======="
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    style={{ height: '38px', padding: '0 12px', backgroundColor: 'transparent', border: 'none', color: '#60A5FA', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ← Change Email
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{ height: '38px', padding: '0 16px', backgroundColor: 'transparent', border: '1px solid #475569', borderRadius: '8px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      style={{ height: '38px', padding: '0 20px', backgroundColor: '#0F4C81', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                    >
                      {modalLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: Enter & Confirm New Password */}
            {modalStep === 3 && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} />
                  <span>OTP Verified! Set your new password below.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    style={{ display: 'block', width: '100%', height: '40px', padding: '0 14px', backgroundColor: '#2B3546', border: '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    style={{ display: 'block', width: '100%', height: '40px', padding: '0 14px', backgroundColor: '#2B3546', border: '1px solid #475569', borderRadius: '8px', color: '#F8FAFC', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{ height: '38px', padding: '0 16px', backgroundColor: 'transparent', border: '1px solid #475569', borderRadius: '8px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    style={{ height: '38px', padding: '0 20px', backgroundColor: '#10B981', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {modalLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
