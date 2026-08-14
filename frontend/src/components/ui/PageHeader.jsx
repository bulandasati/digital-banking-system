import React from 'react';

const PageHeader = ({ title, description, action }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #374151' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
        {description && <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '6px', fontWeight: '400', margin: '6px 0 0 0' }}>{description}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
};

export default PageHeader;
