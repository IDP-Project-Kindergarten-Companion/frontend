// src/components/ui/Button.js
import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false, fullWidth = false, iconLeft, iconRight, className = "" }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface";
  const variantStyles = {
    primary: "text-white bg-brand-primary hover:bg-brand-primaryHover focus:ring-brand-primary",
    secondary: "text-brand-primary bg-brand-secondary hover:bg-brand-secondaryHover focus:ring-brand-secondary",
    danger: "text-white bg-brand-error hover:bg-red-700 focus:ring-brand-error", // Example: using a specific darker red for hover
    ghost: "text-brand-text bg-transparent hover:bg-brand-secondary hover:bg-opacity-30 focus:ring-brand-secondary",
  };
  const disabledStyle = "opacity-60 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyles[variant]} ${disabled ? disabledStyle : ''} ${fullWidth ? 'w-full' : ''} ${className} transition-colors duration-150 ease-in-out`}
    >
      {iconLeft && <span className="mr-2 -ml-1 h-5 w-5">{iconLeft}</span>}
      {children}
      {iconRight && <span className="ml-2 -mr-1 h-5 w-5">{iconRight}</span>}
    </button>
  );
};

export default Button;
