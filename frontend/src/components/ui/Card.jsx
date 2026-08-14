import React from 'react';

const Card = ({ children, className = '', title, subtitle, headerAction }) => {
  return (
    <div style={{ backgroundColor: '#1E232D', border: '1px solid #374151', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }} className={className}>
      {(title || subtitle || headerAction) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #374151' }}>
          <div>
            {title && <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', margin: '4px 0 0 0' }}>{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
