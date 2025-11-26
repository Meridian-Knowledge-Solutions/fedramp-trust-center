import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const BaseModal = ({ isOpen, onClose, title, children, size = 'default', variant = 'light' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl'
  };

  const variantClasses = {
    light: {
      container: 'bg-white',
      header: 'border-slate-200 bg-slate-50/50',
      title: 'text-slate-800',
      closeButton: 'hover:bg-slate-200',
      closeIcon: 'text-slate-600',
      body: 'bg-white'
    },
    dark: {
      container: 'bg-[#0f1014]',
      header: 'border-gray-800/50 bg-gradient-to-r from-gray-900/90 to-gray-800/90',
      title: 'text-white',
      closeButton: 'hover:bg-gray-700/50',
      closeIcon: 'text-gray-300',
      body: 'bg-[#151618]'
    }
  };

  const theme = variantClasses[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`${theme.container} rounded-2xl shadow-2xl border border-gray-800/50 w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col m-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme.header} flex justify-between items-center flex-shrink-0`}>
          <h3 className={`text-lg font-bold ${theme.title} tracking-tight`}>{title}</h3>
          <button
            onClick={onClose}
            className={`p-2 ${theme.closeButton} rounded-lg transition-all hover:scale-105`}
            aria-label="Close modal"
          >
            <X size={20} className={theme.closeIcon} />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 overflow-y-auto flex-1 ${theme.body} custom-scrollbar`}>
          {children}
        </div>
      </div>
    </div>
  );
};