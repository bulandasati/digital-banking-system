import React from 'react';

const Badge = ({ children, status = 'active', type }) => {
  const normalized = (status || type || '').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['ACTIVE', 'COMPLETED', 'SUCCESS', 'SAVINGS', 'DEPOSIT', 'CREDITED'].includes(normalized)) {
    styles = 'bg-emerald-500/10 text-[#10B981] border border-emerald-500/30';
  } else if (['PROCESSING', 'PENDING'].includes(normalized)) {
    styles = 'bg-amber-500/10 text-[#F59E0B] border border-amber-500/30';
  } else if (['FAILED', 'BLOCKED', 'DEBITED', 'INACTIVE'].includes(normalized)) {
    styles = 'bg-red-500/10 text-[#EF4444] border border-red-500/30';
  } else if (['CURRENT', 'ADMIN', 'ROLE_ADMIN'].includes(normalized)) {
    styles = 'bg-indigo-500/10 text-[#818CF8] border border-indigo-500/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${styles}`}>
      {children || normalized}
    </span>
  );
};

export default Badge;
