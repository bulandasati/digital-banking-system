import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className={`${sizes[size]} border-indigo-500 border-t-transparent rounded-full animate-spin`} />
      {message && <p className="text-xs font-medium text-slate-400">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
