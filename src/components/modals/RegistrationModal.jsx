import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { BaseModal } from './BaseModal';
import { Shield, Mail, User, FileText, AlertCircle } from 'lucide-react';

export const RegistrationModal = () => {
  const { modals, closeModal } = useModal();
  const { login } = useAuth();
  const { isOpen } = modals.registration;
  
  const [formData, setFormData] = useState({
    email: '',
    agency: '',
    contact: '',
    system: '',
    purpose: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateEmail = (email) => {
    const govMilPattern = /^[^\s@]+@[^\s@]+\.(gov|mil)$/i;
    return govMilPattern.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Must be a .gov or .mil email address';
    }
    if (!formData.agency) {
      newErrors.agency = 'Agency name is required';
    }
    if (!formData.contact) {
      newErrors.contact = 'Contact name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call (replace with actual registration API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo: auto-login
      login(formData.email, formData.agency);
      
      setSubmitStatus({
        type: 'success',
        message: `Registration successful! Welcome, ${formData.agency}.`
      });

      setTimeout(() => {
        closeModal('registration');
        setFormData({ email: '', agency: '', contact: '', system: '', purpose: '' });
        setSubmitStatus(null);
      }, 2000);

    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Registration failed. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeModal('registration');
    setFormData({ email: '', agency: '', contact: '', system: '', purpose: '' });
    setErrors({});
    setSubmitStatus(null);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="🇺🇸 Request Federal Agency Access"
      size="large"
    >
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Shield className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div className="text-sm">
            <p className="text-blue-900 font-medium mb-1">
              Federal Agency Personnel Only
            </p>
            <p className="text-blue-700">
              Access to detailed technical validation findings and authorization package materials 
              is restricted to authorized federal personnel with valid .gov or .mil email addresses.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
            <Mail size={14} className="inline mr-1" />
            Official Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., john.smith@agency.gov"
            className={`w-full px-4 py-2 border ${errors.email ? 'border-red-300' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
            required
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.email}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">Must be a .gov or .mil email address</p>
        </div>

        {/* Agency */}
        <div>
          <label htmlFor="agency" className="block text-sm font-bold text-slate-700 mb-2">
            <Shield size={14} className="inline mr-1" />
            Agency/Organization Name *
          </label>
          <input
            type="text"
            id="agency"
            name="agency"
            value={formData.agency}
            onChange={handleChange}
            placeholder="e.g., Department of Defense"
            className={`w-full px-4 py-2 border ${errors.agency ? 'border-red-300' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
            required
          />
          {errors.agency && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.agency}
            </p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label htmlFor="contact" className="block text-sm font-bold text-slate-700 mb-2">
            <User size={14} className="inline mr-1" />
            Contact Name *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="e.g., John Smith"
            className={`w-full px-4 py-2 border ${errors.contact ? 'border-red-300' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
            required
          />
          {errors.contact && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.contact}
            </p>
          )}
        </div>

        {/* System Name (Optional) */}
        <div>
          <label htmlFor="system" className="block text-sm font-bold text-slate-700 mb-2">
            <FileText size={14} className="inline mr-1" />
            System/Project Name
          </label>
          <input
            type="text"
            id="system"
            name="system"
            value={formData.system}
            onChange={handleChange}
            placeholder="e.g., Agency Training Platform"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-1">Optional</p>
        </div>

        {/* Purpose (Optional) */}
        <div>
          <label htmlFor="purpose" className="block text-sm font-bold text-slate-700 mb-2">
            Access Purpose
          </label>
          <textarea
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="e.g., Authorization review for new system deployment"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">Optional</p>
        </div>

        {/* Submit Status */}
        {submitStatus && (
          <div className={`p-4 rounded-lg ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {submitStatus.message}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Register for Access'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          By registering, you acknowledge that access is restricted to federal personnel 
          for official government use only.
        </p>
      </div>
    </BaseModal>
  );
};