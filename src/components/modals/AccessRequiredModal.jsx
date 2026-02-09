import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal } from './BaseModal';

// ── Shared inline styles ──
const s = {
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
  },
  subheading: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    margin: '8px auto 0',
    lineHeight: 1.5,
    maxWidth: 360,
  },
  submitBtn: {
    width: '100%',
    padding: '13px 24px',
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    border: 'none',
    borderRadius: 10,
    letterSpacing: '0.01em',
    transition: 'opacity 0.2s, transform 0.15s',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  ghostBtn: {
    width: '100%',
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    marginTop: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 24,
    lineHeight: 1.5,
    textAlign: 'center',
  },
  lockWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.15)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '16px 20px',
    marginTop: 24,
    textAlign: 'left',
  },
  benefitsTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
    marginTop: 0,
  },
  benefitRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
};

export const AccessRequiredModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { isOpen, data } = modals.accessRequired;

  const handleRequestAccess = () => {
    closeModal('accessRequired');
    openModal('registration');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('accessRequired')}
      title=""
      size="default"
      variant="dark"
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        {/* Lock icon */}
        <div style={s.lockWrap}>
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 style={{ ...s.heading, marginTop: 24 }}>
          {data?.featureName || 'This feature'} requires authentication
        </h2>
        <p style={s.subheading}>
          Access to technical validation findings and authorization materials is restricted to
          authorized federal personnel.
        </p>

        {/* Benefits */}
        {data?.benefits && data.benefits.length > 0 && (
          <div style={s.benefitsBox}>
            <p style={s.benefitsTitle}>With federal access</p>
            {data.benefits.map((benefit, index) => (
              <div key={index} style={s.benefitRow}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5 }}>
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ marginTop: 28 }}>
          <button onClick={handleRequestAccess} style={s.submitBtn}>
            Request federal access →
          </button>
          <button onClick={() => closeModal('accessRequired')} style={s.ghostBtn}>
            Continue as public user
          </button>
        </div>

        <p style={s.footer}>Requires a valid .gov or .mil email address</p>
      </div>
    </BaseModal>
  );
};
