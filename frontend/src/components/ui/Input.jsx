import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  rightElement
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 px-3.5 bg-[#0B1220] border ${
            error ? 'border-red-500' : 'border-[#263247]'
          } focus:border-[#4F46E5] rounded-lg text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors disabled:opacity-50`}
        />
        {rightElement && (
          <div className="absolute right-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 font-medium mt-1">⚠️ {error}</p>
      )}
    </div>
  );
};

export default Input;
