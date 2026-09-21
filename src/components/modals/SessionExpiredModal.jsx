import React from 'react';
import { Clock } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal, modalButton } from './BaseModal';

const s = {
  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.6,
    margin: 0,
  },
  panel: {
    marginTop: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderLeft: '2px solid #f59e0b',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.55,
  },
  hint: {
    marginTop: 16,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.28)',
  },
};

export const SessionExpiredModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { isOpen, data } = modals.sessionExpired;

  const handleReverify = () => {
    closeModal('sessionExpired');
    openModal('registration');
  };

  const footer = (
    <>
      <button style={modalButton.ghost} onClick={() => closeModal('sessionExpired')}>
        Not now
      </button>
      <button style={modalButton.primary} onClick={handleReverify}>
        Re-verify access →
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('sessionExpired')}
      title="Your session has expired"
      eyebrow="Session"
      icon={Clock}
      accent="amber"
      size="small"
      variant="dark"
      footer={footer}
    >
      <p style={s.sub}>
        For your security, your access session has ended. Re-verify your federal email to continue
        {data?.featureName ? ` with ${data.featureName.toLowerCase()}` : ''}.
      </p>
      <div style={s.panel}>
        Federal access sessions are time-limited and can end when credentials are rotated.
        Re-verifying takes a moment and restores full access to certification materials.
      </div>
      <p style={s.hint}>Requires a valid .gov or .mil email address.</p>
    </BaseModal>
  );
};
