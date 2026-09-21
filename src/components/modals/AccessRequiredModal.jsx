import React from 'react';
import { Lock, Check } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal, modalButton } from './BaseModal';

const s = {
  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.6,
    margin: 0,
  },
  benefitsBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '16px 20px',
    marginTop: 20,
  },
  benefitsTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 12px',
  },
  benefitRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  hint: {
    marginTop: 16,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.28)',
  },
};

export const AccessRequiredModal = () => {
  const { modals, closeModal, openModal } = useModal();
  const { isOpen, data } = modals.accessRequired;

  const handleRequestAccess = () => {
    closeModal('accessRequired');
    openModal('registration');
  };

  const footer = (
    <>
      <button style={modalButton.ghost} onClick={() => closeModal('accessRequired')}>
        Continue as public
      </button>
      <button style={modalButton.primary} onClick={handleRequestAccess}>
        Request federal access →
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('accessRequired')}
      title={`${data?.featureName || 'This feature'} requires authentication`}
      eyebrow="Restricted"
      icon={Lock}
      accent="indigo"
      size="default"
      variant="dark"
      footer={footer}
    >
      <p style={s.sub}>
        Access to technical validation findings and certification materials is restricted to
        authorized federal personnel.
      </p>

      {data?.benefits && data.benefits.length > 0 && (
        <div style={s.benefitsBox}>
          <p style={s.benefitsTitle}>With federal access</p>
          {data.benefits.map((benefit, index) => (
            <div key={index} style={s.benefitRow}>
              <Check size={16} strokeWidth={2.5} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5 }}>{benefit}</span>
            </div>
          ))}
        </div>
      )}

      <p style={s.hint}>Requires a valid .gov or .mil email address.</p>
    </BaseModal>
  );
};
