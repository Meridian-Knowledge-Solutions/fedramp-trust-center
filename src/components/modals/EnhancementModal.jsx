import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal } from './BaseModal';
import { TrendingUp, Lightbulb, CheckCircle } from 'lucide-react';

export const EnhancementModal = () => {
  const { modals, closeModal } = useModal();
  const { isOpen, data } = modals.enhancement;

  if (!data) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('enhancement')}
      title={`🗂️ Additional Context: ${data.ksiId || 'KSI'}`}
      size="default"
    >
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🗂️</div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">Additional Context Available</h3>
        <p className="text-slate-600 mb-6">
          This KSI provides additional context and enhancement opportunities beyond baseline compliance requirements.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-6">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-blue-900 mb-2">Continuous Improvement</h4>
              <p className="text-sm text-blue-700">
                While this control meets FedRAMP requirements, there are opportunities to enhance your security posture through additional best practices.
              </p>
            </div>
          </div>
        </div>

        {data.description && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-left mb-6">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Current Status</h4>
            <p className="text-sm text-slate-600">{data.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <CheckCircle className="text-green-600 mb-2" size={20} />
            <h4 className="font-bold text-green-900 text-sm mb-1">Compliant</h4>
            <p className="text-xs text-green-700">
              Meets baseline security requirements
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Lightbulb className="text-blue-600 mb-2" size={20} />
            <h4 className="font-bold text-blue-900 text-sm mb-1">Enhancement Available</h4>
            <p className="text-xs text-blue-700">
              Optional improvements identified
            </p>
          </div>
        </div>

        {data.reason && (
          <div className="mt-6 text-left">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Details</h4>
            <p className="text-sm text-slate-600">{data.reason}</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};