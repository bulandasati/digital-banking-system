import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorState = ({ title = 'An Error Occurred', message = 'Failed to load data from the banking service. Please try again.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#172033] border border-red-500/30 rounded-xl space-y-3">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
        <AlertCircle size={24} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-100">{title}</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-[#0B1220] border border-[#263247] text-xs font-semibold text-slate-200 hover:bg-[#1E293B] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
