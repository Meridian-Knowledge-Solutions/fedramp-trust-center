import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal } from './BaseModal';
import { Lock, Shield, CheckCircle } from 'lucide-react';

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
      title="🔒 Federal Agency Access Required"
      size="default"
    >
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Lock className="text-blue-600" size={40} />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-3">
          {data?.featureName || 'This Feature'} Requires Authentication
        </h3>

        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Access to detailed technical validation findings and authorization materials 
          is restricted to authorized federal personnel.
        </p>

        {/* Feature Benefits */}
        {data?.benefits && data.benefits.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
            <h4 className="font-bold text-slate-900 mb-4 text-sm">
              With Federal Access, you can:
            </h4>
            <ul className="space-y-3">
              {data.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-sm text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Call to Action */}
        <div className="space-y-3">
          <button
            onClick={handleRequestAccess}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Shield size={18} />
            Request Federal Access
          </button>
          
          <button
            onClick={() => closeModal('accessRequired')}
            className="w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Continue as Public User
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Federal access requires a valid .gov or .mil email address
          </p>
        </div>
      </div>
    </BaseModal>
  );
};