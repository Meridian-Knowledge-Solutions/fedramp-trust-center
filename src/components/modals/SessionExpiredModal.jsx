import React from 'react';
import { Clock } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal } from './BaseModal';

// Shared inline styles — mirror AccessRequiredModal's tokens so the two read as
// one system. Amber accent (not the indigo "restricted" lock or a success
// green) signals a time-based, recoverable state rather than a hard denial.
const s = {
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.18)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '24px 0 0',
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
  },
  subheading: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    margin: '10px auto 0',
    lineHeight: 1.55,
    maxWidth: 380,
  },
  reasonBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '14px 18px',
    marginTop: 24,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.55,
    textAlign: 'left',
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
};

export const SessionExpiredModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { isOpen, data } = modals.sessionExpired;

  const handleReverify = () => {
    closeModal('sessionExpired');
    openModal('registration');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('sessionExpired')}
      title=""
      size="small"
      variant="dark"
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={s.iconWrap}>
          <Clock size={34} strokeWidth={1.5} color="#fbbf24" />
        </div>

        <h2 style={s.heading}>Your session has expired</h2>
        <p style={s.subheading}>
          For your security, your access session has ended. Re-verify your federal email to
          continue{data?.featureName ? ` with ${data.featureName.toLowerCase()}` : ''}.
        </p>

        <div style={s.reasonBox}>
          Federal access sessions are time-limited and can be ended when credentials are rotated.
          Re-verifying takes a moment and restores full access to certification materials.
        </div>

        <div style={{ marginTop: 28 }}>
          <button onClick={handleReverify} style={s.submitBtn}>
            Re-verify federal access →
          </button>
          <button onClick={() => closeModal('sessionExpired')} style={s.ghostBtn}>
            Not now
          </button>
        </div>

        <p style={s.footer}>Requires a valid .gov or .mil email address</p>
      </div>
    </BaseModal>
  );
};
