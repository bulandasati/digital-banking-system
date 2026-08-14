import React from 'react';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  children,
  error,
  required = false,
  disabled = false,
  className = ''
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className={className}>
      {label && (
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 14px',
          backgroundColor: '#2B3546',
          border: error ? '1px solid #EF4444' : '1px solid #475569',
          borderRadius: '8px',
          color: '#F8FAFC',
          fontSize: '13px',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {children ? children : options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled} style={{ backgroundColor: '#1E232D', color: opt.disabled ? '#94A3B8' : '#F8FAFC' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '500', margin: '2px 0 0 0' }}>⚠️ {error}</p>
      )}
    </div>
  );
};

export default Select;
