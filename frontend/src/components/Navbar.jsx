import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, LogOut, Menu, X, ChevronDown, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const profileRef = useRef(null);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{ backgroundColor: '#1E232D', borderBottom: '1px solid #374151', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxSizing: 'border-box' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#0F4C81', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(15, 76, 129, 0.4)' }}>
            <Landmark size={20} />
          </div>
          <div>
            <span style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#FFFFFF', display: 'block', lineHeight: 1.2 }}>
              APEX BANK
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500', display: 'block' }}>Digital Banking System</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="hidden lg:flex">
          {!isAdmin ? (
            <>
              <Link
                to="/"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/') ? '#0F4C81' : 'transparent',
                  color: isActive('/') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/accounts"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/accounts') ? '#0F4C81' : 'transparent',
                  color: isActive('/accounts') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                My Accounts
              </Link>
              <Link
                to="/transfer"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/transfer') ? '#0F4C81' : 'transparent',
                  color: isActive('/transfer') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Send Money
              </Link>
              <Link
                to="/deposit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/deposit') ? '#0F4C81' : 'transparent',
                  color: isActive('/deposit') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Deposit Funds
              </Link>
              <Link
                to="/transactions"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/transactions') ? '#0F4C81' : 'transparent',
                  color: isActive('/transactions') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Passbook
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/admin/dashboard"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/admin/dashboard') ? '#0F4C81' : 'transparent',
                  color: isActive('/admin/dashboard') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Admin Overview
              </Link>
              <Link
                to="/admin/users"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/admin/users') ? '#0F4C81' : 'transparent',
                  color: isActive('/admin/users') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Users
              </Link>
              <Link
                to="/admin/accounts"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/admin/accounts') ? '#0F4C81' : 'transparent',
                  color: isActive('/admin/accounts') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Accounts Control
              </Link>
              <Link
                to="/admin/transactions"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive('/admin/transactions') ? '#0F4C81' : 'transparent',
                  color: isActive('/admin/transactions') ? '#FFFFFF' : '#CBD5E1'
                }}
              >
                Audit Log
              </Link>
            </>
          )}
        </div>

        {/* Right Section: User Profile Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* User Profile */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#2B3546',
                border: '1px solid #475569',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#0F4C81', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getInitials(user.fullName || user.username)}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }} className="hidden sm:block">
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#F8FAFC', display: 'block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName || user.username}
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', fontWeight: '500' }}>
                  {isAdmin ? 'ADMIN' : 'CUSTOMER'}
                </span>
              </div>
              <ChevronDown size={14} style={{ color: '#94A3B8' }} />
            </button>

            {profileDropdownOpen && (
              <div style={{ position: 'absolute', right: 0, marginTop: '8px', width: '220px', backgroundColor: '#1E232D', border: '1px solid #374151', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 50 }}>
                <div style={{ padding: '10px', backgroundColor: '#2B3546', borderRadius: '8px', border: '1px solid #475569', marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#F8FAFC' }}>{user.fullName || user.username}</p>
                  <p style={{ fontSize: '11px', color: '#94A3B8' }}>@{user.username || 'user'}</p>
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#CBD5E1',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <User size={14} /> My Profile
                </button>

                <div style={{ paddingTop: '8px', borderTop: '1px solid #374151', marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#EF4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#2B3546', border: '1px solid #475569', color: '#CBD5E1', cursor: 'pointer' }}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ borderTop: '1px solid #374151', backgroundColor: '#1E232D', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }} className="lg:hidden">
          {!isAdmin ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/') ? '#0F4C81' : 'transparent', color: isActive('/') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Dashboard
              </Link>
              <Link
                to="/accounts"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/accounts') ? '#0F4C81' : 'transparent', color: isActive('/accounts') ? '#FFFFFF' : '#CBD5E1' }}
              >
                My Accounts
              </Link>
              <Link
                to="/transfer"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/transfer') ? '#0F4C81' : 'transparent', color: isActive('/transfer') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Send Money
              </Link>
              <Link
                to="/deposit"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/deposit') ? '#0F4C81' : 'transparent', color: isActive('/deposit') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Deposit Funds
              </Link>
              <Link
                to="/transactions"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/transactions') ? '#0F4C81' : 'transparent', color: isActive('/transactions') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Passbook
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/admin/dashboard') ? '#0F4C81' : 'transparent', color: isActive('/admin/dashboard') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Admin Overview
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/admin/users') ? '#0F4C81' : 'transparent', color: isActive('/admin/users') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Users
              </Link>
              <Link
                to="/admin/accounts"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/admin/accounts') ? '#0F4C81' : 'transparent', color: isActive('/admin/accounts') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Accounts Control
              </Link>
              <Link
                to="/admin/transactions"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', backgroundColor: isActive('/admin/transactions') ? '#0F4C81' : 'transparent', color: isActive('/admin/transactions') ? '#FFFFFF' : '#CBD5E1' }}
              >
                Audit Log
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
