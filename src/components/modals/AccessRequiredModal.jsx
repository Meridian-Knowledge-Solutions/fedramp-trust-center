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
      variant="dark"
    >
      <div className="text-center py-8">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 shadow-2xl">
            <Lock className="text-blue-400" size={48} />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">
          {data?.featureName || 'This Feature'} Requires Authentication
        </h3>

        <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
          Access to detailed technical validation findings and authorization materials
          is restricted to authorized federal personnel.
        </p>

        {/* Feature Benefits */}
        {data?.benefits && data.benefits.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-8 text-left shadow-xl">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-800">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Shield size={16} className="text-blue-400" />
              </div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                With Federal Access
              </h4>
            </div>
            <ul className="space-y-4">
              {data.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30 mt-0.5">
                    <CheckCircle className="text-green-400" size={14} />
                  </div>
                  <span className="text-sm text-gray-200 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Call to Action */}
        <div className="space-y-3">
          <button
            onClick={handleRequestAccess}
            className="group relative w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Shield size={18} />
              Request Federal Access
            </span>
          </button>

          <button
            onClick={() => closeModal('accessRequired')}
            className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors border border-gray-700"
          >
            Continue as Public User
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Federal access requires a valid .gov or .mil email address
          </p>
        </div>
      </div>
    </BaseModal>
  );
};