import React, { useState } from 'react';
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
    margin: '6px 0 24px',
    lineHeight: 1.5,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: '0.01em',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    color: '#f1f5f9',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  error: {
    fontSize: 12,
    color: '#fca5a5',
    marginTop: 4,
    marginBottom: 0,
  },
  statusBox: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 14,
    fontWeight: 500,
  },
  submitBtn: {
    flex: 1,
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
  cancelBtn: {
    padding: '13px 24px',
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 20,
    lineHeight: 1.5,
    textAlign: 'center',
  },
  stepRow: { display: 'flex', alignItems: 'center', gap: 12 },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'all 0.3s',
  },
  stepLabel: { fontSize: 14, transition: 'color 0.3s' },
};

// ── Reusable field ──
const Field = ({ label, name, type = 'text', placeholder, hint, value, onChange, error, required, textarea }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <label style={s.label}>
        {label} {required && <span style={{ color: '#818cf8' }}>*</span>}
      </label>
      {hint && <span style={s.hint}>{hint}</span>}
    </div>
    {textarea ? (
      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={3}
        style={{
          ...s.input,
          resize: 'vertical',
          minHeight: 80,
          ...(error ? { borderColor: 'rgba(248,113,113,0.5)' } : {}),
        }}
      />
    ) : (
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          ...s.input,
          ...(error ? { borderColor: 'rgba(248,113,113,0.5)' } : {}),
        }}
      />
    )}
    {error && <p style={s.error}>{error}</p>}
  </div>
);

// ── Stepper steps ──
const steps = [
  { label: 'Register', active: true },
  { label: 'Verify email', active: false },
  { label: 'Access granted', active: false },
];

export const RegistrationModal = () => {
  const { modals, closeModal } = useModal();
  const { isOpen } = modals.registration;

  const [formData, setFormData] = useState({
    email: '',
    agency: '',
    contact: '',
    system: '',
    purpose: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.(gov|mil|fed\.us)$/i.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (submitStatus) setSubmitStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email))
      newErrors.email = 'Must be a .gov, .mil, or .fed.us email';
    if (!formData.agency) newErrors.agency = 'Agency name is required';
    if (!formData.contact) newErrors.contact = 'Contact name is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        'https://7d7pdwb9t3.execute-api.us-east-1.amazonaws.com/prod';
      const payload = {
        agency: formData.agency,
        email: formData.email,
        contact: formData.contact,
        system_name: formData.system,
        purpose: formData.purpose,
      };

      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Registration failed: ${response.statusText}`);

      setSubmitStatus({
        type: 'success',
        message: 'Verification email sent! Please check your inbox to complete registration.',
      });

      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Registration Error:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Registration failed. Please check your connection and try again.',
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
    <BaseModal isOpen={isOpen} onClose={handleClose} title="" size="large" variant="dark">
      <div style={{ display: 'flex', gap: 0 }}>
        {/* ── Left: Form ── */}
        <div style={{ flex: 1, paddingRight: 32 }}>
          <h2 style={s.heading}>Enter your details</h2>
          <p style={s.subheading}>
            Federal personnel only — .gov / .mil / .fed.us email required.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field
              label="Contact name"
              name="contact"
              placeholder="Jane Doe"
              value={formData.contact}
              onChange={handleChange}
              error={errors.contact}
              required
            />
            <Field
              label="Official email"
              name="email"
              type="email"
              placeholder="jane.doe@agency.gov"
              hint="No spam, guaranteed."
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Field
              label="Agency / Organization"
              name="agency"
              placeholder="e.g. Department of Defense"
              value={formData.agency}
              onChange={handleChange}
              error={errors.agency}
              required
            />
            <Field
              label="System / Project name"
              name="system"
              placeholder="e.g. Agency Training Platform"
              hint="Optional"
              value={formData.system}
              onChange={handleChange}
            />
            <Field
              label="Access purpose"
              name="purpose"
              placeholder="e.g. Authorization review for new deployment"
              hint="Optional"
              value={formData.purpose}
              onChange={handleChange}
              textarea
            />

            {/* Status message */}
            {submitStatus && (
              <div
                style={{
                  ...s.statusBox,
                  borderColor:
                    submitStatus.type === 'success'
                      ? 'rgba(52,211,153,0.4)'
                      : 'rgba(248,113,113,0.4)',
                  color: submitStatus.type === 'success' ? '#6ee7b7' : '#fca5a5',
                }}
              >
                {submitStatus.message}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...s.submitBtn,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Submitting…' : 'Request access →'}
              </button>
              <button type="button" onClick={handleClose} style={s.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>

          <p style={s.footer}>
            By registering you acknowledge access is restricted to federal personnel for official use only.
          </p>
        </div>

        {/* ── Right: Stepper ── */}
        <div
          style={{
            width: 170,
            paddingLeft: 28,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            paddingTop: 8,
          }}
        >
          {steps.map((step, i) => (
            <div key={i} style={s.stepRow}>
              <div
                style={{
                  ...s.stepDot,
                  background: step.active ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  boxShadow: step.active ? '0 0 0 4px rgba(99,102,241,0.25)' : 'none',
                }}
              />
              <span
                style={{
                  ...s.stepLabel,
                  color: step.active ? '#e0e7ff' : 'rgba(255,255,255,0.35)',
                  fontWeight: step.active ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
};
