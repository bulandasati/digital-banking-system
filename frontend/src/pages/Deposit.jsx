import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ShieldCheck, Wallet, ArrowDownLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById('razorpay-sdk-script');
    if (existing) {
      existing.onload = () => resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Deposit = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axiosClient.get('/api/v1/accounts/my-accounts');
        const accs = res.data || [];
        setAccounts(accs);
        if (accs.length > 0) {
          setAccountNumber(accs[0].accountNumber);
        }
      } catch (err) {
        toast.error('Failed to load user accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleProceedRazorpay = async (e) => {
    e.preventDefault();
    if (!accountNumber || !amount) {
      toast.error('Please select an account and enter deposit amount');
      return;
    }

    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    setSubmitting(true);

    try {
      // 0. Ensure Razorpay SDK script is loaded cleanly once
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay Payment Gateway. Check network connection.');
        setSubmitting(false);
        return;
      }

      // 1. Create Razorpay Payment Order via backend
      const orderRes = await axiosClient.post('/api/v1/payments/create-order', {
        accountNumber,
        amount: numAmt,
        email: user?.email || '',
        description: 'Instant Account Deposit'
      });

      const orderData = orderRes.data;

      // 2. Open Official Razorpay Checkout Modal with real user info
      const options = {
        key: orderData.razorpayKeyId || orderData.keyId,
        amount: orderData.amount * 100, // Amount in paise
        currency: orderData.currency || 'INR',
        name: 'Apex Digital Bank Ltd',
        description: 'Instant Account Deposit',
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          // 3. Verify Payment Signature via backend
          try {
            toast.info('Verifying payment signature with bank...');
            await axiosClient.post('/api/v1/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setReceipt({
              id: response.razorpay_payment_id,
              referenceNumber: response.razorpay_order_id,
              accountNumber,
              amount: numAmt,
              status: 'COMPLETED'
            });
            toast.success('Deposit successful! Account credited.');
          } catch (err) {
            toast.error('Payment signature verification failed.');
          }
        },
        prefill: {
          name: user?.fullName || user?.username || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#0F4C81'
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(`Payment failed: ${response.error?.description || 'Transaction cancelled'}`);
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Deposit Funds"
        description="Fund your bank account instantly using official Razorpay Payment Gateway integration."
      />

      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {accounts.length === 0 && !loading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Wallet size={40} style={{ color: '#94A3B8', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>No Bank Accounts Available</h4>
              <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '6px', marginBottom: '20px' }}>You need an active bank account before depositing funds.</p>
              <Link to="/accounts" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#0F4C81',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Create Bank Account
                </button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {!receipt ? (
              <Card title="Instant Account Deposit" subtitle="Select target account and deposit amount">
                <form onSubmit={handleProceedRazorpay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Select
                    label="Target Account"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    options={accounts.map((acc) => ({
                      value: acc.accountNumber,
                      label: `${acc.accountNumber} (${acc.accountType}) — Bal: ₹${(acc.balance || 0).toLocaleString('en-IN')}`
                    }))}
                    required
                  />

                  <Input
                    label="Deposit Amount (₹)"
                    type="number"
                    name="amount"
                    placeholder="5000.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />

                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#2B3546', border: '1px solid #475569', fontSize: '12px', color: '#CBD5E1' }}>
                    <p style={{ fontWeight: 'bold', color: '#60A5FA', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} /> Official Razorpay 256-Bit SSL Gateway
                    </p>
                    <p style={{ margin: '4px 0 0 0' }}>Supports UPI, NetBanking, and Credit/Debit Cards in Test Mode.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      backgroundColor: '#0F4C81',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(15, 76, 129, 0.4)',
                      marginTop: '8px',
                      opacity: submitting ? 0.7 : 1
                    }}
                  >
                    {submitting ? 'Initializing Gateway...' : 'Pay via Razorpay'}
                  </button>
                </form>
              </Card>
            ) : (
              <Card title="Deposit Receipt" subtitle="Payment Processed Successfully">
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>Deposit Complete</h3>
                  <p style={{ fontSize: '24px', fontWeight: '800', color: '#10B981', margin: '4px 0 0 0' }}>
                    +₹{receipt.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#2B3546', border: '1px solid #475569', fontSize: '12px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #374151' }}>
                    <span>Razorpay Payment ID:</span>
                    <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 'bold' }}>{receipt.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #374151' }}>
                    <span>Account Number:</span>
                    <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{receipt.accountNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    <Badge status={receipt.status}>{receipt.status}</Badge>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setReceipt(null);
                    setAmount('');
                  }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    backgroundColor: '#0F4C81',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                >
                  Make Another Deposit
                </button>
              </Card>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Deposit;
