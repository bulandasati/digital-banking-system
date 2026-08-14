import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Users, ShieldAlert, FileText, Landmark, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';

const AdminDashboard = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/v1/admin/dashboard');
      setDashboardMetrics(res.data || {});
      setTransactions(res.data?.recentTransactions || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const totalUsersCount = dashboardMetrics?.totalUsers ?? 0;
  const totalAccountsCount = dashboardMetrics?.totalAccounts ?? 0;
  const totalLiquidity = dashboardMetrics?.totalBankLiquidity ?? 0;
  const totalTxCount = dashboardMetrics?.totalTransactions ?? 0;

  const columns = [
    {
      header: 'Ref ID',
      accessorKey: 'referenceNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 'bold' }}>{tx.referenceNumber}</span>
    },
    {
      header: 'Sender',
      accessorKey: 'senderAccountNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{tx.senderAccountNumber}</span>
    },
    {
      header: 'Receiver',
      accessorKey: 'receiverAccountNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{tx.receiverAccountNumber}</span>
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (tx) => <Badge status={tx.type}>{tx.type}</Badge>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (tx) => <Badge status={tx.status}>{tx.status}</Badge>
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
        title="Admin Control Center"
        description="System-wide metrics, multi-service account auditing, and fraud oversight."
        action={
          <button
            onClick={fetchAdminMetrics}
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
            <RefreshCw size={16} /> Refresh Overview
          </button>
        }
      />

      {/* Admin Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <Card title="Total Registered Users">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC', margin: 0 }}>{totalUsersCount}</h2>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(15, 76, 129, 0.2)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <Link to="/admin/users" style={{ fontSize: '12px', color: '#60A5FA', textDecoration: 'none', fontWeight: '600', display: 'block', marginTop: '12px' }}>
            Manage Users →
          </Link>
        </Card>

        <Card title="Total Active Accounts">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC', margin: 0 }}>{totalAccountsCount}</h2>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <Link to="/admin/accounts" style={{ fontSize: '12px', color: '#60A5FA', textDecoration: 'none', fontWeight: '600', display: 'block', marginTop: '12px' }}>
            Manage Accounts →
          </Link>
        </Card>

        <Card title="System Ledger Volume">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', margin: 0 }}>
              ₹{parseFloat(totalLiquidity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={20} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '12px 0 0 0' }}>Bank Liquidity Reserve</p>
        </Card>

        <Card title="System Transactions">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC', margin: 0 }}>{totalTxCount}</h2>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(15, 76, 129, 0.2)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
          </div>
          <Link to="/admin/transactions" style={{ fontSize: '12px', color: '#60A5FA', textDecoration: 'none', fontWeight: '600', display: 'block', marginTop: '12px' }}>
            View Audit Logs →
          </Link>
        </Card>
      </div>

      {/* Recent System Audit Log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>Recent System Audit Log</h3>
        <DataTable columns={columns} data={transactions} loading={loading} emptyMessage="No system audit logs found" />
      </div>
    </PageContainer>
  );
};

export default AdminDashboard;
