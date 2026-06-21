import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { BaseModal } from './BaseModal';
import { Shield, Mail, User, FileText, AlertCircle } from 'lucide-react';

export const RegistrationModal = () => {
  const { modals, closeModal } = useModal();
  // const { login } = useAuth(); // REMOVED: Do not auto-login. User must verify email first.
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
    const govMilPattern = /^[^\s@]+@[^\s@]+\.(gov|mil|fed\.us)$/i; // Updated regex to match backend validation
    return govMilPattern.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      newErrors.email = 'Must be a .gov, .mil, or .fed.us email address';
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
      // --- START REAL API INTEGRATION ---
      
      // 1. Get API Endpoint (Ensure VITE_API_URL is set in your .env file)
      // Fallback is provided but should be replaced with your real API Gateway URL
      const API_URL = import.meta.env.VITE_API_URL || 'https://7d7pdwb9t3.execute-api.us-east-1.amazonaws.com/prod';

      // 2. Prepare payload to match Backend expectations
      const payload = {
        agency: formData.agency,
        email: formData.email,
        contact: formData.contact,
        system_name: formData.system, // Backend expects 'system_name', not 'system'
        purpose: formData.purpose
      };

      console.log("Submitting registration to:", `${API_URL}/register`);

      // 3. Execute Fetch
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Registration failed: ${response.statusText}`);
      }

      console.log("Registration Success:", result);

      // 4. Handle Success
      setSubmitStatus({
        type: 'success',
        message: 'Verification email sent! Please check your inbox to complete registration.'
      });

      // Clear form after delay, but don't auto-login
      setTimeout(() => {
        closeModal('registration');
        setFormData({ email: '', agency: '', contact: '', system: '', purpose: '' });
        setSubmitStatus(null);
      }, 3000);
      
      // --- END REAL API INTEGRATION ---

    } catch (error) {
      console.error("Registration Error:", error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Registration failed. Please check your connection and try again.'
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
      variant="dark"
    >
      <div className="mb-6">
        <div className="bg-[#818cf8]/[0.06] border border-[#818cf8]/30 rounded-xl p-5 flex items-start gap-3">
          <div className="p-2 bg-[#818cf8]/10 rounded-lg border border-[#818cf8]/30 flex-shrink-0">
            <Shield className="text-[#818CF8]" size={20} />
          </div>
          <div className="text-sm">
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#818CF8] mb-2">
              Federal Agency Personnel Only
            </p>
            <p className="text-[#788596] leading-relaxed">
              Access to detailed technical validation findings and authorization package materials
              is restricted to authorized federal personnel with valid .gov or .mil email addresses.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[#788596] mb-2">
            <Mail size={14} className="inline mr-1 text-[#818CF8]" />
            Official Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., john.smith@agency.gov"
            className={`w-full px-4 py-3 bg-[#0A0E13] border ${errors.email ? 'border-[#F2607A]/60' : 'border-[#1A222D]'
              } rounded-lg focus:ring-1 focus:ring-[#818cf8]/30 focus:border-[#818cf8]/60 text-[#E8EEF4] placeholder-[#424E5C] font-mono text-[13px] outline-none transition-all`}
            required
          />
          {errors.email && (
            <p className="text-[11px] text-[#F2607A] mt-2 flex items-center gap-1 font-mono">
              <AlertCircle size={12} />
              {errors.email}
            </p>
          )}
          <p className="text-[11px] text-[#424E5C] mt-1.5 font-mono">Must be a .gov, .mil, or .fed.us email address</p>
        </div>

        {/* Agency */}
        <div>
          <label htmlFor="agency" className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[#788596] mb-2">
            <Shield size={14} className="inline mr-1 text-[#818CF8]" />
            Agency/Organization Name *
          </label>
          <input
            type="text"
            id="agency"
            name="agency"
            value={formData.agency}
            onChange={handleChange}
            placeholder="e.g., Department of Defense"
            className={`w-full px-4 py-3 bg-[#0A0E13] border ${errors.agency ? 'border-[#F2607A]/60' : 'border-[#1A222D]'
              } rounded-lg focus:ring-1 focus:ring-[#818cf8]/30 focus:border-[#818cf8]/60 text-[#E8EEF4] placeholder-[#424E5C] font-mono text-[13px] outline-none transition-all`}
            required
          />
          {errors.agency && (
            <p className="text-[11px] text-[#F2607A] mt-2 flex items-center gap-1 font-mono">
              <AlertCircle size={12} />
              {errors.agency}
            </p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label htmlFor="contact" className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[#788596] mb-2">
            <User size={14} className="inline mr-1 text-[#818CF8]" />
            Contact Name *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="e.g., John Smith"
            className={`w-full px-4 py-3 bg-[#0A0E13] border ${errors.contact ? 'border-[#F2607A]/60' : 'border-[#1A222D]'
              } rounded-lg focus:ring-1 focus:ring-[#818cf8]/30 focus:border-[#818cf8]/60 text-[#E8EEF4] placeholder-[#424E5C] font-mono text-[13px] outline-none transition-all`}
            required
          />
          {errors.contact && (
            <p className="text-[11px] text-[#F2607A] mt-2 flex items-center gap-1 font-mono">
              <AlertCircle size={12} />
              {errors.contact}
            </p>
          )}
        </div>

        {/* System Name (Optional) */}
        <div>
          <label htmlFor="system" className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[#788596] mb-2">
            <FileText size={14} className="inline mr-1 text-[#818CF8]" />
            System/Project Name
          </label>
          <input
            type="text"
            id="system"
            name="system"
            value={formData.system}
            onChange={handleChange}
            placeholder="e.g., Agency Training Platform"
            className="w-full px-4 py-3 bg-[#0A0E13] border border-[#1A222D] rounded-lg focus:ring-1 focus:ring-[#818cf8]/30 focus:border-[#818cf8]/60 text-[#E8EEF4] placeholder-[#424E5C] font-mono text-[13px] outline-none transition-all"
          />
          <p className="text-[11px] text-[#424E5C] mt-1.5 font-mono">Optional</p>
        </div>

        {/* Purpose (Optional) */}
        <div>
          <label htmlFor="purpose" className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-[#788596] mb-2">
            Access Purpose
          </label>
          <textarea
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="e.g., Authorization review for new system deployment"
            rows={3}
            className="w-full px-4 py-3 bg-[#0A0E13] border border-[#1A222D] rounded-lg focus:ring-1 focus:ring-[#818cf8]/30 focus:border-[#818cf8]/60 text-[#E8EEF4] placeholder-[#424E5C] font-mono text-[13px] resize-none outline-none transition-all"
          />
          <p className="text-[11px] text-[#424E5C] mt-1.5 font-mono">Optional</p>
        </div>

        {/* Submit Status */}
        {submitStatus && (
          <div className={`p-4 rounded-lg border ${submitStatus.type === 'success'
              ? 'bg-[#34E0C4]/10 border-[#34E0C4]/30 text-[#34E0C4]'
              : 'bg-[#F2607A]/10 border-[#F2607A]/30 text-[#F2607A]'
            }`}>
            <p className="font-mono text-[13px]">{submitStatus.message}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex-1 px-6 py-4 bg-[#818CF8] hover:bg-[#9aa3fa] disabled:bg-[#1A222D] text-[#07090C] disabled:text-[#788596] rounded-xl font-mono text-[13px] font-semibold tracking-wide transition-all hover:shadow-[0_0_24px_-4px_#818CF8] disabled:shadow-none disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Shield size={16} />
              {isSubmitting ? 'Submitting…' : 'Register for Access'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-4 bg-transparent hover:border-[#788596] text-[#E8EEF4] rounded-xl font-mono text-[13px] transition-colors border border-[#1A222D]"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-[#1A222D]">
        <p className="text-[11px] text-[#788596] text-center leading-relaxed font-mono">
          By registering, you acknowledge that access is restricted to federal personnel
          for official government use only.
        </p>
      </div>
    </BaseModal>
  );
};
