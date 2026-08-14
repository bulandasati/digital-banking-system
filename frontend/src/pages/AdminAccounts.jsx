import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { ShieldAlert, RefreshCw, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccAction, setSelectedAccAction] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/v1/accounts/admin/all');
      setAccounts(res.data || []);
    } catch (err) {
      toast.error('Failed to load accounts directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleToggleStatus = async () => {
    if (!selectedAccAction) return;
    setUpdating(true);
    const isBlocked = selectedAccAction.status === 'BLOCKED';
    const actionPath = isBlocked ? 'unblock' : 'block';

    try {
      await axiosClient.put(`/api/v1/accounts/${selectedAccAction.accountNumber}/${actionPath}`);
      toast.success(`Account ${selectedAccAction.accountNumber} ${isBlocked ? 'unblocked' : 'frozen'} successfully`);
      setSelectedAccAction(null);
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to update account status');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      header: 'Account Number',
      accessorKey: 'accountNumber',
      cell: (acc) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#F8FAFC' }}>{acc.accountNumber}</span>
    },
    {
      header: 'Account Holder Name',
      accessorKey: 'accountHolderName',
      cell: (acc) => <span style={{ fontWeight: '600', color: '#F8FAFC' }}>{acc.accountHolderName || 'Customer'}</span>
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (acc) => <span style={{ color: '#94A3B8', fontSize: '13px' }}>{acc.email || 'N/A'}</span>
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
        <span style={{ fontWeight: 'bold', color: '#10B981', display: 'block', textAlign: 'right' }}>
          ₹{(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      className: 'text-center',
      cell: (acc) => {
        const isBlocked = acc.status === 'BLOCKED';
        return (
          <button
            onClick={() => setSelectedAccAction(acc)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: isBlocked ? '#10B981' : '#EF4444',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
            {isBlocked ? 'Unfreeze' : 'Freeze'}
          </button>
        );
      }
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Account Administration & Control"
        description="Monitor system balances, freeze suspicious accounts, or unfreeze audited accounts."
        action={
          <button
            onClick={fetchAccounts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#2B3546',
              border: '1px solid #475569',
              color: '#F8FAFC',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} /> Refresh Accounts
          </button>
        }
      />

      <Card>
        <DataTable columns={columns} data={accounts} loading={loading} emptyMessage="No bank accounts found in system ledger" />
      </Card>

      {/* Freeze / Unfreeze Confirmation Modal */}
      {selectedAccAction && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAccAction(null)}
          title={selectedAccAction.status === 'BLOCKED' ? 'Unfreeze Bank Account' : 'Freeze Bank Account'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: selectedAccAction.status === 'BLOCKED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: `1px solid ${selectedAccAction.status === 'BLOCKED' ? '#10B981' : '#EF4444'}` }}>
              <ShieldAlert size={24} style={{ color: selectedAccAction.status === 'BLOCKED' ? '#10B981' : '#EF4444' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#F8FAFC' }}>
                  Account #{selectedAccAction.accountNumber} ({selectedAccAction.accountHolderName || 'Customer'})
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#CBD5E1' }}>
                  {selectedAccAction.status === 'BLOCKED'
                    ? 'Unfreezing will restore immediate fund transfers and transaction capability.'
                    : 'Freezing will block all outbound transfers and withdrawals immediately.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setSelectedAccAction(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#2B3546', color: '#F8FAFC', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={updating}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: selectedAccAction.status === 'BLOCKED' ? '#10B981' : '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {updating ? 'Updating...' : selectedAccAction.status === 'BLOCKED' ? 'Confirm Unfreeze' : 'Confirm Freeze'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};

export default AdminAccounts;
