import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Plus, CreditCard, Copy, Check, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import DataTable from '../components/ui/DataTable';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [accountType, setAccountType] = useState('SAVINGS');
  const [submitting, setSubmitting] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/v1/accounts/my-accounts');
      setAccounts(res.data || []);
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const hasSavings = accounts.some((acc) => acc.accountType === 'SAVINGS');
  const hasCurrent = accounts.some((acc) => acc.accountType === 'CURRENT');
  const allLimitReached = hasSavings && hasCurrent;

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (allLimitReached) {
      toast.warning('Maximum account limit reached (1 SAVINGS & 1 CURRENT account allowed per customer).');
      return;
    }
    setSubmitting(true);
    try {
      await axiosClient.post('/api/v1/accounts/create', { accountType });
      toast.success(`${accountType} account created successfully!`);
      setOpenModal(false);
      fetchAccounts();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create account';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (accNo) => {
    navigator.clipboard.writeText(accNo);
    setCopiedAcc(accNo);
    toast.info(`Account ${accNo} copied to clipboard!`);
    setTimeout(() => setCopiedAcc(null), 2000);
  };

  const columns = [
    {
      header: 'Account Number',
      accessorKey: 'accountNumber',
      cell: (acc) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#F8FAFC' }}>{acc.accountNumber}</span>
          <button
            onClick={() => copyToClipboard(acc.accountNumber)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
            title="Copy Account Number"
          >
            {copiedAcc === acc.accountNumber ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
          </button>
        </div>
      )
    },
    {
      header: 'Type',
      accessorKey: 'accountType',
      cell: (acc) => <Badge status={acc.accountType}>{acc.accountType}</Badge>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (acc) => <Badge status={acc.status || 'ACTIVE'}>{acc.status || 'ACTIVE'}</Badge>
    },
    {
      header: 'Balance',
      accessorKey: 'balance',
      className: 'text-right',
      cell: (acc) => (
        <span style={{ fontWeight: 'bold', color: '#10B981', fontSize: '14px', display: 'block', textAlign: 'right' }}>
          ₹{(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="My Bank Accounts"
        description="Manage your active savings and current accounts or open a new digital account."
        action={
          <button
            onClick={() => setOpenModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: '#0F4C81',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 76, 129, 0.4)'
            }}
          >
            <Plus size={16} /> Open New Account
          </button>
        }
      />

      {/* Account Cards Container */}
      {accounts.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {accounts.map((acc) => (
            <Card key={acc.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <Badge status={acc.accountType}>{acc.accountType}</Badge>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace', color: '#F8FAFC', margin: 0 }}>{acc.accountNumber}</h3>
                    <button
                      onClick={() => copyToClipboard(acc.accountNumber)}
                      style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                    >
                      {copiedAcc === acc.accountNumber ? <Check size={16} style={{ color: '#10B981' }} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <Badge status={acc.status || 'ACTIVE'}>{acc.status || 'ACTIVE'}</Badge>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Available Balance:</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#10B981' }}>
                  ₹{(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Wallet size={40} style={{ color: '#94A3B8', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>No Active Bank Accounts</h4>
            <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '6px', marginBottom: '20px' }}>You don't have any open accounts yet. Open a digital savings or current account to get started.</p>
            <button
              onClick={() => setOpenModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
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
              <Plus size={16} /> Open New Account
            </button>
          </div>
        </Card>
      )}

      {/* Account Table Detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>Account List Detail</h3>
        <DataTable columns={columns} data={accounts} loading={loading} emptyMessage="No bank accounts registered" />
      </div>

      {/* Open Account Modal */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Open New Digital Banking Account"
        footerAction={
          <>
            <button
              onClick={() => setOpenModal(false)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#2B3546',
                border: '1px solid #475569',
                color: '#F8FAFC',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAccount}
              disabled={submitting}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#0F4C81',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {allLimitReached ? (
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', fontSize: '13px', fontWeight: '600' }}>
              ⚠️ You have reached the maximum account limit (1 SAVINGS & 1 CURRENT account allowed per customer).
            </div>
          ) : (
            <Select
              label="Select Account Type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              options={[
                { value: 'SAVINGS', label: hasSavings ? 'SAVINGS ACCOUNT — 🛑 (Already Created)' : 'SAVINGS ACCOUNT (Standard Retail)', disabled: hasSavings },
                { value: 'CURRENT', label: hasCurrent ? 'CURRENT ACCOUNT — 🛑 (Already Created)' : 'CURRENT ACCOUNT (Commercial & Business)', disabled: hasCurrent }
              ]}
            />
          )}

          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#2B3546', border: '1px solid #475569', fontSize: '12px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontWeight: 'bold', color: '#60A5FA', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> Account Limit Policy (Max 1 SAVINGS & 1 CURRENT)
            </p>
            <p style={{ margin: 0, marginTop: '4px' }}>Each customer is permitted to hold at most 1 Savings account and 1 Current account. Opening a duplicate account type is restricted by banking regulations.</p>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default Accounts;
