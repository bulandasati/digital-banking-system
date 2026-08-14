import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Send, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Copy, Check, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';

const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Modal (if flagged), 3: Success Receipt

  const [formData, setFormData] = useState({
    senderAccountNumber: '',
    receiverAccountNumber: '',
    amount: '',
    description: ''
  });

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [flaggedReason, setFlaggedReason] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (step !== 2) {
      setTimeLeft(300);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleCancelTransfer();
          toast.error('⏰ OTP verification expired (5 min). Debited funds refunded.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await axiosClient.get('/api/v1/accounts/my-accounts');
      const accList = res.data || [];
      setAccounts(accList);
      if (accList.length > 0) {
        setFormData((prev) => ({ ...prev, senderAccountNumber: accList[0].accountNumber }));
      }
    } catch (err) {
      toast.error('Failed to load accounts for transfer');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!formData.senderAccountNumber || !formData.receiverAccountNumber || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.senderAccountNumber === formData.receiverAccountNumber) {
      toast.error('Sender and Beneficiary account cannot be the same');
      return;
    }

    const selectedAcc = accounts.find((a) => a.accountNumber === formData.senderAccountNumber);
    if (selectedAcc && parseFloat(formData.amount) > selectedAcc.balance) {
      toast.error(`Insufficient balance in account ${selectedAcc.accountNumber}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        senderAccountNumber: formData.senderAccountNumber,
        receiverAccountNumber: formData.receiverAccountNumber,
        amount: parseFloat(formData.amount),
        description: formData.description || 'Instant Transfer'
      };

      const res = await axiosClient.post('/api/v1/transactions/transfer', payload);
      let txData = res.data;

      // Poll up to 4 times (400ms interval) to wait for Kafka fraud-check resolution
      for (let attempt = 0; attempt < 4; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        try {
          const checkRes = await axiosClient.get(`/api/v1/transactions/${txData.id}`);
          if (checkRes.data) {
            txData = checkRes.data;
            if (txData.status !== 'PROCESSING') {
              break;
            }
          }
        } catch (e) {
          console.warn('Status poll check error:', e);
        }
      }

      setReceipt(txData);

      // Check if transaction requires step-up OTP
      if (txData.status === 'PENDING_VERIFICATION' || txData.status === 'FLAGGED') {
        setFlaggedReason(txData.failureReason || 'High volume / security risk threshold exceeded');
        setStep(2);
        toast.warning('⚠️ Fraud risk rule triggered! Step-Up OTP Verification Required.');
      } else if (txData.status === 'COMPLETED') {
        setStep(3);
        toast.success('Instant money transfer executed successfully!');
      } else {
        // Fallback if status is still processing or pending
        setFlaggedReason('Security risk verification required');
        setStep(2);
        toast.warning('⚠️ Step-Up OTP Verification Required.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setOtpError('Please enter the OTP code.');
      return;
    }

    setOtpError('');
    setSubmitting(true);

    try {
      if (receipt && receipt.id) {
        const res = await axiosClient.post(`/api/v1/transactions/${receipt.id}/verify?otp=${otp}`);
        setReceipt(res.data);
      }
      setStep(3);
      toast.success('OTP Verified! Transfer completed successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Invalid OTP code. Please check your registered email.';
      setOtpError(msg);
      toast.error(msg);
      // Close modal on 3rd attempt block, flagged transaction, expired OTP, or any non-retryable error
      if (!msg.includes('remaining')) {
        resetForm();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTransfer = async () => {
    try {
      if (receipt && receipt.id) {
        await axiosClient.post(`/api/v1/transactions/${receipt.id}/cancel`);
        toast.info('Transfer cancelled. Debited amount has been refunded to your account.');
      }
    } catch (err) {
      console.warn('Cancel notice:', err);
    } finally {
      resetForm();
    }
  };

  const resetForm = () => {
    setStep(1);
    setOtp('');
    setReceipt(null);
    setFormData({
      senderAccountNumber: accounts[0]?.accountNumber || '',
      receiverAccountNumber: '',
      amount: '',
      description: ''
    });
  };

  const handleCopyRef = () => {
    if (receipt?.referenceNumber) {
      navigator.clipboard.writeText(receipt.referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Send Money"
        description="Instant 2-Phase SAGA money transfer with automated AI fraud risk evaluation."
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? '#60A5FA' : '#94A3B8', fontWeight: '700', fontSize: '13px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step >= 1 ? '#0F4C81' : '#2B3546', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
            Transfer Request
          </div>
          <div style={{ width: '40px', height: '2px', backgroundColor: step >= 2 ? '#0F4C81' : '#374151' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? '#60A5FA' : '#94A3B8', fontWeight: '700', fontSize: '13px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step >= 2 ? '#0F4C81' : '#2B3546', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
            {step === 2 ? 'Fraud Step-Up OTP' : 'Verification'}
          </div>
          <div style={{ width: '40px', height: '2px', backgroundColor: step === 3 ? '#10B981' : '#374151' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === 3 ? '#10B981' : '#94A3B8', fontWeight: '700', fontSize: '13px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step === 3 ? '#10B981' : '#2B3546', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            Receipt
          </div>
        </div>

        {/* STEP 1: Transfer Form */}
        {step === 1 && (
          <Card title="Initiate Money Transfer">
            <form onSubmit={handleInitiateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '8px' }}>
                  Select Source Account
                </label>
                <Select
                  name="senderAccountNumber"
                  value={formData.senderAccountNumber}
                  onChange={handleChange}
                  disabled={loadingAccounts}
                >
                  {accounts.length === 0 ? (
                    <option value="">No active accounts found — Open an account in My Accounts</option>
                  ) : (
                    accounts.map((acc) => (
                      <option key={acc.id || acc.accountNumber} value={acc.accountNumber} disabled={acc.status === 'BLOCKED'} style={{ backgroundColor: '#1E232D', color: acc.status === 'BLOCKED' ? '#EF4444' : '#F8FAFC' }}>
                        {acc.accountType} — {acc.accountNumber} {acc.status === 'BLOCKED' ? '🛑 (ACCOUNT BLOCKED)' : `(Available: ₹${(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})`}
                      </option>
                    ))
                  )}
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '8px' }}>
                  Beneficiary 12-Digit Account Number
                </label>
                <input
                  type="text"
                  name="receiverAccountNumber"
                  value={formData.receiverAccountNumber}
                  onChange={handleChange}
                  placeholder="e.g. 926594266827"
                  maxLength={12}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2B3546',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '8px' }}>
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="1"
                  step="any"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2B3546',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '8px' }}>
                  Remark / Description (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g. Rent, Vendor Payment"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2B3546',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ padding: '12px', backgroundColor: 'rgba(15, 76, 129, 0.15)', borderRadius: '8px', border: '1px solid #0F4C81', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} style={{ color: '#60A5FA', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.4 }}>
                  AI Fraud Evaluation running in background. Standard transfers execute instantly; suspicious transactions trigger Step-Up OTP.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#0F4C81',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}
              >
                {submitting ? 'Executing Transfer...' : <><Send size={16} /> Execute Transfer</>}
              </button>
            </form>
          </Card>
        )}

        {/* STEP 2: Fraud Step-Up OTP Verification (Only if flagged) */}
        {step === 2 && (
          <Card title="Fraud Risk Detection — Step-Up Authorization">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertCircle size={24} style={{ color: '#EF4444' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#F8FAFC', display: 'block' }}>High Risk Threshold Triggered</span>
                  <span style={{ fontSize: '12px', color: '#CBD5E1' }}>{flaggedReason || 'Unusual volume or high-percentage transfer detected by Fraud Service.'}</span>
                </div>
                <div style={{ padding: '6px 12px', backgroundColor: '#334155', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>Time Left</span>
                  <span style={{ fontSize: '15px', color: '#F59E0B', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60) < 10 ? '0' : ''}${timeLeft % 60}`}
                  </span>
                </div>
              </div>

              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '8px' }}>
                    Enter Authorization OTP (Sent to your registered email)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#2B3546',
                      border: '1px solid #475569',
                      color: '#F8FAFC',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      letterSpacing: '0.2em',
                      boxSizing: 'border-box'
                    }}
                  />
                  {otpError && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>{otpError}</p>}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleCancelTransfer}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#2B3546', color: '#F8FAFC', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {submitting ? 'Verifying...' : 'Authorize OTP'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* STEP 3: Transfer Receipt */}
        {step === 3 && receipt && (
          <Card title="Transfer Receipt">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', marginTop: '16px' }}>
              
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#F8FAFC', margin: 0 }}>
                  ₹{receipt.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p style={{ fontSize: '13px', color: '#10B981', fontWeight: '600', margin: '4px 0 0 0' }}>
                  Transfer Completed Successfully
                </p>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#2B3546', borderRadius: '12px', border: '1px solid #475569', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Reference ID:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 'bold' }}>{receipt.referenceNumber}</span>
                    <button onClick={handleCopyRef} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                      {copied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Sender Account:</span>
                  <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{receipt.senderAccountNumber}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Beneficiary Account:</span>
                  <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{receipt.receiverAccountNumber}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Status:</span>
                  <Badge status={receipt.status}>{receipt.status}</Badge>
                </div>
              </div>

              <button
                onClick={resetForm}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#0F4C81',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Make Another Transfer
              </button>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default Transfer;
