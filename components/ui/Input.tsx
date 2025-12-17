import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#003366] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-lg border-2 border-[#e0e0e0] focus:border-[#003366] focus:outline-none transition-colors duration-200 text-[#003366] placeholder:text-gray-400 ${className} ${
          error ? 'border-[#e60012]' : ''
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[#e60012]">{error}</p>
      )}
    </div>
  );
}

