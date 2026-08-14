import React from 'react';

const PageContainer = ({ children, className = '' }) => {
  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', backgroundColor: '#243044', color: '#FFFFFF', padding: '28px 32px 48px 32px', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }} className={className}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
