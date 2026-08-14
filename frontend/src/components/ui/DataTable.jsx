import React from 'react';

const DataTable = ({ columns, data, loading, emptyMessage = 'No records found' }) => {
  if (loading) {
    return (
      <div style={{ width: '100%', padding: '40px', textAlign: 'center', color: '#CBD5E1', backgroundColor: '#1E232D', border: '1px solid #374151', borderRadius: '14px' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #0F4C81', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }}></div>
        <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', padding: '40px', textAlign: 'center', color: '#94A3B8', backgroundColor: '#1E232D', border: '1px solid #374151', borderRadius: '14px' }}>
        <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #374151', borderRadius: '14px', backgroundColor: '#1E232D', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)' }}>
      <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', color: '#F8FAFC', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#2B3546', fontSize: '11px', fontWeight: '700', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #374151' }}>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{ padding: '14px 18px' }} className={col.className || ''}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ divideY: '1px solid #374151' }}>
          {data.map((row, rowIdx) => (
            <tr key={row.id || rowIdx} style={{ borderBottom: rowIdx < data.length - 1 ? '1px solid #374151' : 'none', transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2B3546'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '500' }} className={col.className || ''}>
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
