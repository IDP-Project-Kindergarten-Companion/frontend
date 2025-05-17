// src/components/ui/Card.js
import React from 'react';

const Card = ({ children, title, className = "" }) => (
  <div className={`bg-brand-surface shadow-xl rounded-xl overflow-hidden ${className}`}>
    {title && (
      <div className="px-4 py-5 sm:px-6 bg-brand-background border-b border-brand-border">
        <h3 className="text-lg leading-6 font-medium text-brand-text">{title}</h3>
      </div>
    )}
    <div className="px-4 py-5 sm:p-6">
      {children}
    </div>
  </div>
);

export default Card;
