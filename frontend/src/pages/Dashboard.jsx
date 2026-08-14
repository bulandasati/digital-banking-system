import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Eye, EyeOff, Send, ArrowDownLeft, Plus, CreditCard, TrendingUp, TrendingDown, RefreshCw, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);

  const fetchAccountsAndTx = async () => {
    setLoading(true);
    try {
      const accRes = await axiosClient.get('/api/v1/accounts/my-accounts');
      const userAccounts = accRes.data || [];
      setAccounts(userAccounts);

      if (userAccounts.length > 0) {
        const primaryAcc = userAccounts[0].accountNumber;
        try {
          const txRes = await axiosClient.get(`/api/v1/transactions/account/${primaryAcc}`);
          setAllTransactions(txRes.data || []);
          setTransactions((txRes.data || []).slice(0, 5));
        } catch (txErr) {
          console.error('Failed to fetch transactions for account:', txErr);
          setAllTransactions([]);
          setTransactions([]);
        }
      } else {
        setAllTransactions([]);
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard accounts:', err);
      setAccounts([]);
      setAllTransactions([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsAndTx();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const primaryAccountNo = accounts[0]?.accountNumber;

  const moneyIn = allTransactions
    .filter(tx => (tx.status === 'COMPLETED' || !tx.status) && (tx.receiverAccountNumber === primaryAccountNo || tx.type === 'DEPOSIT'))
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const moneyOut = allTransactions
    .filter(tx => (tx.status === 'COMPLETED' || !tx.status) && tx.senderAccountNumber === primaryAccountNo && tx.type !== 'DEPOSIT')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const openingBalance = totalBalance + moneyOut - moneyIn;

  const chartData = [
    { date: 'Opening', balance: openingBalance }
  ];

  let runningBalance = openingBalance;
  [...allTransactions].reverse().forEach((tx, idx) => {
    if (tx.status && tx.status !== 'COMPLETED') return;
    const isSender = tx.senderAccountNumber === primaryAccountNo;
    if (isSender) {
      runningBalance -= (tx.amount || 0);
    } else {
      runningBalance += (tx.amount || 0);
    }

    const txDate = tx.createdAt
      ? new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `Tx #${idx + 1}`;

    chartData.push({
      date: txDate,
      balance: runningBalance
    });
  });

  if (chartData[chartData.length - 1]?.balance !== totalBalance) {
    chartData.push({
      date: 'Current',
      balance: totalBalance
    });
  }

  const columns = [
    {
      header: 'Reference',
      accessorKey: 'referenceNumber',
      cell: (tx) => <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 'bold' }}>{tx.referenceNumber || 'N/A'}</span>
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (tx) => <Badge status={tx.status}>{tx.type}</Badge>
    },
    {
      header: 'Account / Description',
      accessorKey: 'description',
      cell: (tx) => {
        const isSender = tx.senderAccountNumber === primaryAccountNo;
        return (
          <div>
            <p style={{ fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>{tx.description || tx.type}</p>
            <p style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', margin: '2px 0 0 0' }}>
              {isSender ? `To: ${tx.receiverAccountNumber}` : `From: ${tx.senderAccountNumber}`}
            </p>
          </div>
        );
      }
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
        const isSender = tx.senderAccountNumber === primaryAccountNo && tx.type !== 'DEPOSIT';
        const isPending = tx.status === 'PENDING_VERIFICATION' || tx.status === 'PROCESSING';
        const isFailed = tx.status === 'FAILED' || tx.status === 'FLAGGED' || tx.status === 'CANCELLED';

        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: isFailed ? '#94A3B8' : isPending ? '#F59E0B' : isSender ? '#EF4444' : '#10B981',
              textDecoration: isFailed ? 'line-through' : 'none'
            }}>
              {isSender ? '-' : '+'}₹{tx.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
    }
  ];

  return (
    <PageContainer>
      
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.fullName || user?.username}`}
        description="Here is your digital account overview and real-time financial trajectory."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/transfer" style={{ textDecoration: 'none' }}>
              <button
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
                <Send size={16} /> Send Money
              </button>
            </Link>
            <Link to="/deposit" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
                <ArrowDownLeft size={16} /> Deposit
              </button>
            </Link>
          </div>
        }
      />

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Total Net Balance */}
        <Card title="Total Available Net Balance" subtitle="Combined balance across active accounts">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC', margin: 0 }}>
              {showBalance ? `₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••••'}
            </h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              title={showBalance ? "Hide Balance" : "Show Balance"}
            >
              {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
            <span>Primary Account:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#F8FAFC' }}>{primaryAccountNo || 'No Accounts'}</span>
          </div>
        </Card>

        {/* Money Received */}
        <Card title="Total Inflow (Deposits & Credit)" subtitle="Cumulative deposits and transfers in">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', margin: 0 }}>
              +₹{moneyIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
            <span>Status:</span>
            <Badge status="COMPLETED">Cleared</Badge>
          </div>
        </Card>

        {/* Money Sent */}
        <Card title="Total Outflow (Transfers)" subtitle="Cumulative SAGA money transfers sent">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '8px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#F8FAFC', margin: 0 }}>
              ₹{moneyOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(15, 76, 129, 0.2)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
            <span>Active Accounts:</span>
            <span style={{ fontWeight: 'bold', color: '#F8FAFC' }}>{accounts.length} Active</span>
          </div>
        </Card>
      </div>

      {/* Active Accounts Cards Section */}
      {accounts.length > 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>Active Bank Accounts</h3>
            <Link to="/accounts" style={{ fontSize: '12px', color: '#60A5FA', textDecoration: 'none', fontWeight: '600' }}>
              Manage Accounts →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  backgroundColor: '#1E232D',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#0F4C81', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{acc.accountType || 'SAVINGS'}</span>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#F8FAFC', fontFamily: 'monospace', margin: 0 }}>{acc.accountNumber}</p>
                    </div>
                  </div>
                  <Badge status={acc.status}>{acc.status || 'ACTIVE'}</Badge>
                </div>
                <div style={{ paddingTop: '10px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Available Balance:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981' }}>
                    ₹{acc.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="mb-6">
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Wallet size={36} style={{ color: '#94A3B8', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>No Bank Accounts Created Yet</h4>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px', marginBottom: '16px' }}>Create your first checking or savings account to start depositing and sending funds.</p>
            <Link to="/accounts" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#0F4C81',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Create Bank Account
              </button>
            </Link>
          </div>
        </Card>
      )}

      {/* Balance Trend Chart */}
      <div style={{ marginBottom: '24px' }}>
        <Card title="Account Balance Trajectory" subtitle="Historical balance evolution based on transaction history">
          <div style={{ height: '240px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#0F4C81" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E232D', borderColor: '#374151', borderRadius: '8px', color: '#F8FAFC', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Balance']}
                />
                <Area type="monotone" dataKey="balance" stroke="#0F4C81" strokeWidth={3} fillOpacity={1} fill="url(#balanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', itemsCenter: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>Recent Account Activity</h3>
          <Link to="/transactions" style={{ fontSize: '12px', color: '#60A5FA', textDecoration: 'none', fontWeight: '600' }}>
            View Passbook →
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={transactions}
          loading={loading}
          emptyMessage="No recent transactions found"
        />
      </div>

    </PageContainer>
  );
};

export default Dashboard;
