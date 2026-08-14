import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, Filter, Eye, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';

const Transactions = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [filteredTx, setFilteredTx] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedTxDetail, setSelectedTxDetail] = useState(null);

  useEffect(() => {
    const fetchUserAccounts = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/api/v1/accounts/my-accounts');
        const accs = res.data || [];
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAcc(accs[0].accountNumber);
        } else {
          setLoading(false);
        }
      } catch (err) {
        toast.error('Failed to load accounts');
        setLoading(false);
      }
    };
    fetchUserAccounts();
  }, []);

  const fetchPassbook = async (accNo) => {
    if (!accNo) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/api/v1/transactions/account/${accNo}`);
      setTransactions(res.data || []);
      setFilteredTx(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch transaction passbook');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAcc) {
      fetchPassbook(selectedAcc);
    }
  }, [selectedAcc]);

  useEffect(() => {
    let result = [...transactions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (tx) => tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== 'ALL') {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    setFilteredTx(result);
  }, [searchTerm, typeFilter, transactions]);

  const columns = [
    {
      header: 'Reference ID',
      accessorKey: 'referenceNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 'bold' }}>{tx.referenceNumber || 'N/A'}</span>
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (tx) => <Badge status={tx.type}>{tx.type}</Badge>
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (tx) => (
        <div>
          <p style={{ fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>{tx.description || tx.type}</p>
          <p style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', margin: '2px 0 0 0' }}>
            {tx.senderAccountNumber === selectedAcc
              ? `To: ${tx.receiverAccountNumber}`
              : `From: ${tx.senderAccountNumber}`}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (tx) => <Badge status={tx.status}>{tx.status}</Badge>
    },
    {
      header: 'Date & Time',
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
      cell: (tx) => {
        const isOutflow = tx.senderAccountNumber === selectedAcc && tx.type !== 'DEPOSIT';
        const isPending = tx.status === 'PENDING_VERIFICATION' || tx.status === 'PROCESSING';
        const isFailed = tx.status === 'FAILED' || tx.status === 'FLAGGED' || tx.status === 'CANCELLED';

        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: isFailed ? '#94A3B8' : isPending ? '#F59E0B' : isOutflow ? '#EF4444' : '#10B981',
              textDecoration: isFailed ? 'line-through' : 'none'
            }}>
              {isOutflow ? '-' : '+'}₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {isPending && (
              <span style={{ fontSize: '10px', color: '#F59E0B', display: 'block', fontWeight: 'bold' }}>
                (OTP Verification Required)
              </span>
            )}
            {isFailed && (
              <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', fontWeight: 'bold' }}>
                (Refunded / Cancelled)
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      className: 'text-center',
      cell: (tx) => (
        <button
          onClick={() => setSelectedTxDetail(tx)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#2B3546',
            border: '1px solid #475569',
            color: '#F8FAFC',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <Eye size={14} /> Details
        </button>
      )
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Passbook & Statement"
        description="Audit log of all credits, debits, and SAGA transactions for selected account."
      />

      {/* Filter Bar */}
      <Card className="mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Select
            label="Select Account"
            value={selectedAcc}
            onChange={(e) => setSelectedAcc(e.target.value)}
            options={accounts.map((acc) => ({
              value: acc.accountNumber,
              label: `${acc.accountNumber} (${acc.accountType})`
            }))}
          />

          <Input
            label="Search Reference ID"
            placeholder="Search by Reference ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            label="Transaction Type Filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Transaction Types' },
              { value: 'TRANSFER', label: 'TRANSFER (Outflow/Inflow)' },
              { value: 'DEPOSIT', label: 'DEPOSIT (Gateway Credit)' }
            ]}
          />
        </div>
      </Card>

      {/* Passbook Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>
            Transaction Entries ({filteredTx.length})
          </h3>
          <button
            onClick={() => fetchPassbook(selectedAcc)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#2B3546',
              border: '1px solid #475569',
              color: '#F8FAFC',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <DataTable columns={columns} data={filteredTx} loading={loading} emptyMessage="No transactions found for this account" />
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedTxDetail}
        onClose={() => setSelectedTxDetail(null)}
        title="Transaction Detail View"
        footerAction={
          <button
            onClick={() => setSelectedTxDetail(null)}
            style={{
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
            Close
          </button>
        }
      >
        {selectedTxDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #374151' }}>
              <span>Reference Number:</span>
              <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 'bold' }}>{selectedTxDetail.referenceNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #374151' }}>
              <span>Sender Account:</span>
              <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{selectedTxDetail.senderAccountNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #374151' }}>
              <span>Receiver Account:</span>
              <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{selectedTxDetail.receiverAccountNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #374151' }}>
              <span>Type:</span>
              <Badge status={selectedTxDetail.type}>{selectedTxDetail.type}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #374151' }}>
              <span>Status:</span>
              <Badge status={selectedTxDetail.status}>{selectedTxDetail.status}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #374151' }}>
              <span>Amount:</span>
              <span style={{ fontWeight: 'bold', color: '#10B981', fontSize: '15px' }}>₹{selectedTxDetail.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Timestamp:</span>
              <span>{selectedTxDetail.createdAt ? new Date(selectedTxDetail.createdAt).toLocaleString('en-IN') : 'N/A'}</span>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default Transactions;
