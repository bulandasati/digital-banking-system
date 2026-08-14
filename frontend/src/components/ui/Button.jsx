import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  icon: Icon
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#4F46E5] hover:bg-[#4338CA] text-white',
    secondary: 'bg-[#111827] hover:bg-[#1E293B] border border-[#263247] text-slate-200',
    danger: 'bg-[#EF4444] hover:bg-red-600 text-white',
    success: 'bg-[#10B981] hover:bg-emerald-600 text-white',
    outline: 'border border-[#263247] text-slate-300 hover:bg-slate-800'
  };

  const sizes = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-11 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
};

export default Button;
