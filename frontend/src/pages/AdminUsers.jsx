import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Users, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/v1/auth/users');
      setUsers(res.data || []);
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      header: 'User ID',
      accessorKey: 'id',
      cell: (u) => <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>#{u.id}</span>
    },
    {
      header: 'Full Name / Username',
      accessorKey: 'fullName',
      cell: (u) => (
        <div>
          <p style={{ fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>{u.fullName || u.username}</p>
          <p style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', margin: '2px 0 0 0' }}>@{u.username}</p>
        </div>
      )
    },
    {
      header: 'Email Address',
      accessorKey: 'email',
      cell: (u) => <span style={{ color: '#CBD5E1' }}>{u.email}</span>
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: (u) => <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{u.phone || 'N/A'}</span>
    },
    {
      header: 'System Role',
      accessorKey: 'role',
      cell: (u) => <Badge status={u.role}>{u.role}</Badge>
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="User Management Directory"
        description="Audit registered customer profiles, emails, phone numbers, and system authorization roles."
        action={
          <button
            onClick={fetchUsers}
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
            <RefreshCw size={16} /> Refresh Users
          </button>
        }
      />

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users registered in system" />
    </PageContainer>
  );
};

export default AdminUsers;
