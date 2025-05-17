// src/components/ui/InputField.js
import React from 'react';

const InputField = ({ id, label, type = "text", value, onChange, placeholder, error, required = false, icon }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-brand-textLight mb-1">
      {label} {required && <span className="text-brand-error">*</span>}
    </label>
    <div className="relative rounded-lg shadow-sm">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{React.cloneElement(icon, { className: "h-5 w-5 text-brand-textLight" })}</div>}
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`block w-full px-3 py-2 border ${error ? 'border-brand-error' : 'border-brand-border'} bg-brand-surface text-brand-text rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm ${icon ? 'pl-10' : ''}`}
      />
    </div>
    {error && <p className="mt-1 text-xs text-brand-error">{error}</p>}
  </div>
);

export default InputField;
