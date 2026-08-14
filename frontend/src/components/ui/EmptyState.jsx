import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No Data Available', message = 'There are no records to display at this time.', action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#172033] border border-[#263247] rounded-xl space-y-3">
      <div className="w-12 h-12 rounded-xl bg-[#0B1220] border border-[#263247] flex items-center justify-center text-slate-400">
        <Inbox size={24} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-100">{title}</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
