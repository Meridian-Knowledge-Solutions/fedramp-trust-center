import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Accent palette — drives the header icon chip, eyebrow label, and the hairline
// under the header. Swap per modal intent (info/auth = indigo, warning/expiry =
// amber, success = green, destructive = red).
const ACCENTS = {
  indigo: { fg: '#a5b4fc', bg: 'rgba(99,102,241,0.12)', ring: 'rgba(99,102,241,0.24)', bar: '#6366f1' },
  amber:  { fg: '#fcd34d', bg: 'rgba(245,158,11,0.12)', ring: 'rgba(245,158,11,0.24)', bar: '#f59e0b' },
  green:  { fg: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', ring: 'rgba(16,185,129,0.24)', bar: '#10b981' },
  red:    { fg: '#fca5a5', bg: 'rgba(239,68,68,0.12)',  ring: 'rgba(239,68,68,0.24)',  bar: '#ef4444' },
};

/**
 * Universal modal shell ("Console" design).
 *
 * Header band: optional accent icon chip + optional eyebrow (category) + title,
 * with a close affordance and an accent hairline. Body renders children. An
 * optional `footer` node renders as a right-aligned action bar.
 *
 * Backward compatible: modals passing only `title`/`children` keep working and
 * inherit the upgraded chrome; `icon`, `eyebrow`, `accent`, and `footer` are
 * additive.
 */
export const BaseModal = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  icon: Icon,
  accent = 'indigo',
  children,
  footer,
  size = 'default',
  variant = 'light',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
  };

  const variantClasses = {
    light: {
      container: 'bg-white',
      header: 'border-slate-200 bg-slate-50/50',
      title: 'text-slate-800',
      eyebrow: 'text-slate-400',
      closeButton: 'hover:bg-slate-200',
      closeIcon: 'text-slate-600',
      body: 'bg-white',
      footer: 'border-slate-200 bg-slate-50/50',
    },
    dark: {
      container: 'bg-[#0D1117]',
      header: 'border-[#1A222D] bg-gradient-to-b from-[#0b1016] to-[#0D1117]',
      title: 'text-[#E8EEF4]',
      eyebrow: 'text-[#788596]',
      closeButton: 'hover:bg-[#1A222D]',
      closeIcon: 'text-[#788596]',
      body: 'bg-[#0D1117]',
      footer: 'border-[#1A222D] bg-[#0b1016]',
    },
  };

  const theme = variantClasses[variant] || variantClasses.light;
  const ac = ACCENTS[accent] || ACCENTS.indigo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`${theme.container} rounded-2xl shadow-2xl border border-gray-800/50 w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col m-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div className={`relative px-5 py-4 border-b ${theme.header} flex items-center gap-3.5 flex-shrink-0`}>
          {Icon && (
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 44, height: 44, background: ac.bg, border: `1px solid ${ac.ring}` }}
            >
              <Icon size={22} strokeWidth={1.6} color={ac.fg} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <div
                className="font-mono font-medium uppercase"
                style={{ fontSize: 10.5, letterSpacing: '0.07em', color: ac.fg, opacity: 0.9 }}
              >
                {eyebrow}
              </div>
            )}
            <h3 className={`text-base font-bold ${theme.title} tracking-tight truncate`} style={{ marginTop: eyebrow ? 2 : 0 }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${theme.closeButton} rounded-lg transition-all hover:scale-105 flex-shrink-0`}
            aria-label="Close modal"
          >
            <X size={20} className={theme.closeIcon} />
          </button>
          {/* Accent hairline */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{ height: 1, background: `linear-gradient(90deg, transparent, ${ac.bar}, transparent)`, opacity: 0.5 }}
          />
        </div>

        {/* Body */}
        <div className={`p-6 overflow-y-auto flex-1 ${theme.body} custom-scrollbar`}>{children}</div>

        {/* Footer action bar */}
        {footer && (
          <div className={`px-5 py-3.5 border-t ${theme.footer} flex justify-end items-center gap-2.5 flex-shrink-0`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Shared button styles for footer actions, so every modal's actions match.
export const modalButton = {
  primary: {
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },
  ghost: {
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.55)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
