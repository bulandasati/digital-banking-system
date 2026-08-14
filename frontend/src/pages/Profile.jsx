import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, Lock } from 'lucide-react';

import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Profile = () => {
  const { user, isAdmin } = useAuth();

  return (
    <PageContainer>
      <PageHeader
        title="User Profile & Security"
        description="Manage your account profile, personal identification, and security settings."
      />

      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Card title="Personal Account Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #374151' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#0F4C81', color: '#FFFFFF', fontWeight: 'bold', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#F8FAFC', margin: 0 }}>{user?.fullName || user?.username}</h3>
                <p style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace', margin: '2px 0 6px 0' }}>@{user?.username || 'user'}</p>
                <div>
                  <Badge status={isAdmin ? 'ADMIN' : 'CUSTOMER'}>
                    {isAdmin ? 'ROLE_ADMIN' : 'ROLE_CUSTOMER'}
                  </Badge>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                  <Mail size={16} /> Email Address:
                </span>
                <span style={{ fontWeight: '600', color: '#F8FAFC' }}>{user?.email || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                  <Phone size={16} /> Phone Number:
                </span>
                <span style={{ fontWeight: '600', color: '#F8FAFC' }}>{user?.phone || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #374151' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                  <User size={16} /> Username:
                </span>
                <span style={{ fontWeight: '600', color: '#F8FAFC' }}>{user?.username || 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Security & Compliance" subtitle="HttpOnly Session & Encrypted Tokens">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#CBD5E1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '10px', backgroundColor: '#2B3546', border: '1px solid #475569' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <ShieldCheck size={18} style={{ color: '#10B981' }} /> 256-Bit SSL Connection
              </span>
              <Badge status="COMPLETED">ACTIVE</Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '10px', backgroundColor: '#2B3546', border: '1px solid #475569' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <Lock size={18} style={{ color: '#60A5FA' }} /> JWT Token Authentication
              </span>
              <Badge status="COMPLETED">SECURE</Badge>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Profile;
