// src/components/ui/MessageBox.js
import React from 'react';
import { CheckCircle, XCircle, InfoIcon, AlertTriangle } from 'lucide-react'; // Ensure XCircle is imported if used for dismiss

const MessageBox = ({ message, type, onDismiss }) => {
  if (!message) return null;

  const typeInfo = {
    success: { bg: 'bg-brand-successBg', border: 'border-brand-success', text: 'text-brand-success', IconCmp: CheckCircle },
    error: { bg: 'bg-brand-errorBg', border: 'border-brand-error', text: 'text-brand-error', IconCmp: XCircle },
    info: { bg: 'bg-brand-infoBg', border: 'border-brand-info', text: 'text-brand-info', IconCmp: InfoIcon },
    warning: { bg: 'bg-brand-warningBg', border: 'border-brand-warning', text: 'text-brand-warning', IconCmp: AlertTriangle },
  };
  
  const currentType = typeInfo[type] || typeInfo.info;

  return (
    <div className={`p-4 mb-4 rounded-lg shadow-md flex items-center text-sm ${currentType.bg} ${currentType.border} ${currentType.text}`}>
      <currentType.IconCmp className={`w-5 h-5 mr-3 flex-shrink-0 ${currentType.text}`} />
      <span className="flex-grow">{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:ring-opacity-50 inline-flex h-8 w-8 ${currentType.text} hover:bg-brand-border hover:bg-opacity-20`}
          aria-label="Dismiss"
        >
          <XCircle className="w-5 h-5" /> {/* Using XCircle for dismiss button */}
        </button>
      )}
    </div>
  );
};

export default MessageBox;
