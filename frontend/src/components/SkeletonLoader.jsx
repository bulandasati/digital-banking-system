import React from 'react';

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="fintech-card p-6 space-y-4 animate-pulse">
          <div className="h-4 w-1/3 skeleton-shimmer"></div>
          <div className="h-8 w-2/3 skeleton-shimmer"></div>
          <div className="h-3 w-1/2 skeleton-shimmer"></div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="fintech-card p-6 space-y-4">
      <div className="h-6 w-1/4 skeleton-shimmer mb-6"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/60">
          <div className="space-y-2 w-1/3">
            <div className="h-4 w-full skeleton-shimmer"></div>
            <div className="h-3 w-1/2 skeleton-shimmer"></div>
          </div>
          <div className="h-5 w-20 skeleton-shimmer"></div>
          <div className="h-6 w-24 skeleton-shimmer rounded-full"></div>
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;
