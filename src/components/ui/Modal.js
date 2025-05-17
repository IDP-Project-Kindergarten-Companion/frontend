// src/components/ui/Modal.js
import React from 'react';
import { XCircle } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className={`bg-brand-surface rounded-xl shadow-xl p-6 m-4 ${sizeClasses[size]} w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
          <button onClick={onClose} className="text-brand-textLight hover:text-brand-text">
            <XCircle size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
