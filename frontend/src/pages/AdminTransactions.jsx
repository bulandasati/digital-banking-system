import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTx, setFilteredTx] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/v1/transactions/admin/all');
      setTransactions(res.data || []);
      setFilteredTx(res.data || []);
    } catch (err) {
      toast.error('Failed to load system transactions log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let result = [...transactions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (tx) =>
          (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(term)) ||
          (tx.senderAccountNumber && tx.senderAccountNumber.toLowerCase().includes(term)) ||
          (tx.receiverAccountNumber && tx.receiverAccountNumber.toLowerCase().includes(term)) ||
          (tx.description && tx.description.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((tx) => tx.status === statusFilter);
    }

    setFilteredTx(result);
  }, [searchTerm, statusFilter, transactions]);

  const columns = [
    {
      header: 'Ref ID',
      accessorKey: 'referenceNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 'bold' }}>{tx.referenceNumber}</span>
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (tx) => <Badge status={tx.type}>{tx.type}</Badge>
    },
    {
      header: 'Sender Account',
      accessorKey: 'senderAccountNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{tx.senderAccountNumber || 'SYSTEM'}</span>
    },
    {
      header: 'Receiver Account',
      accessorKey: 'receiverAccountNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{tx.receiverAccountNumber}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (tx) => <Badge status={tx.status}>{tx.status}</Badge>
    },
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: (tx) => (
        <span style={{ color: '#CBD5E1', fontSize: '12px' }}>
          {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : 'Recent'}
        </span>
      )
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      className: 'text-right',
      cell: (tx) => <span style={{ fontWeight: 'bold', color: '#10B981', display: 'block', textAlign: 'right' }}>₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="System-Wide Transaction Audit Log"
        description="Complete Ledger of all inter-account transfers, gateway deposits, and SAGA execution states."
        action={
          <button
            onClick={fetchTransactions}
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
            <RefreshCw size={16} /> Refresh Audit Log
          </button>
        }
      />

      <Card className="mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Input
            label="Search Audit Trail"
            placeholder="Search ref ID, sender, receiver, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'COMPLETED', label: 'COMPLETED (Successful)' },
              { value: 'PROCESSING', label: 'PROCESSING (Pending)' },
              { value: 'FAILED', label: 'FAILED (Rejected)' }
            ]}
          />
        </div>
      </Card>

      <DataTable columns={columns} data={filteredTx} loading={loading} emptyMessage="No transactions matching filter criteria" />
    </PageContainer>
  );
};

export default AdminTransactions;
