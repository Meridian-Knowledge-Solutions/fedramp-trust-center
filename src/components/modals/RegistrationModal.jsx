import React, { useState } from "react";

/*
 * ─── Redesigned Registration + Access Required Modals ───
 * Inspired by Plausible Analytics' clean registration flow
 * with a dark federal theme, stepper sidebar, and refined typography.
 *
 * Drop-in replacements for RegistrationModal and AccessRequiredModal.
 * Dependencies: lucide-react, your ModalContext + BaseModal
 *
 * For standalone preview, a self-contained demo is at the bottom.
 */

// ════════════════════════════════════════════════════════
// 1. RegistrationModal  (redesigned)
// ════════════════════════════════════════════════════════

export const RegistrationModal = () => {
  // Uncomment these when integrating into your app:
  // const { modals, closeModal } = useModal();
  // const { isOpen } = modals.registration;

  const [formData, setFormData] = useState({
    email: "",
    agency: "",
    contact: "",
    system: "",
    purpose: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.(gov|mil|fed\.us)$/i.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (submitStatus) setSubmitStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email))
      newErrors.email = "Must be a .gov, .mil, or .fed.us email";
    if (!formData.agency) newErrors.agency = "Agency name is required";
    if (!formData.contact) newErrors.contact = "Contact name is required";
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const API_URL =
        import.meta.env?.VITE_API_URL ||
        "https://7d7pdwb9t3.execute-api.us-east-1.amazonaws.com/prod";
      const payload = {
        agency: formData.agency,
        email: formData.email,
        contact: formData.contact,
        system_name: formData.system,
        purpose: formData.purpose,
      };
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration failed");
      setSubmitStatus({
        type: "success",
        message: "Verification email sent! Check your inbox.",
      });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Stepper steps ──
  const steps = [
    { label: "Register", active: true },
    { label: "Verify email", active: false },
    { label: "Access granted", active: false },
  ];

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        {/* ── Left: Form ── */}
        <div style={styles.formSide}>
          <h2 style={styles.heading}>Enter your details</h2>
          <p style={styles.subheading}>
            Federal personnel only — .gov / .mil / .fed.us email required.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                  ...styles.statusBox,
                  borderColor:
                    submitStatus.type === "success"
                      ? "rgba(52,211,153,0.4)"
                      : "rgba(248,113,113,0.4)",
                  color:
                    submitStatus.type === "success" ? "#6ee7b7" : "#fca5a5",
                }}
              >
                {submitStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitBtn,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Submitting…" : "Request access →"}
            </button>
          </form>

          <p style={styles.footer}>
            By registering you acknowledge access is restricted to federal
            personnel for official use only.
          </p>
        </div>

        {/* ── Right: Stepper ── */}
        <div style={styles.stepperSide}>
          {steps.map((step, i) => (
            <div key={i} style={styles.stepRow}>
              <div
                style={{
                  ...styles.stepDot,
                  background: step.active ? "#6366f1" : "rgba(255,255,255,0.1)",
                  boxShadow: step.active
                    ? "0 0 0 4px rgba(99,102,241,0.25)"
                    : "none",
                }}
              />
              <span
                style={{
                  ...styles.stepLabel,
                  color: step.active
                    ? "#e0e7ff"
                    : "rgba(255,255,255,0.35)",
                  fontWeight: step.active ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// 2. AccessRequiredModal  (redesigned)
// ════════════════════════════════════════════════════════

export const AccessRequiredModal = ({ onRequestAccess, onClose, featureName, benefits }) => {
  return (
    <div style={styles.backdrop}>
      <div style={{ ...styles.card, maxWidth: 480, flexDirection: "column" }}>
        <div style={{ padding: "48px 40px", textAlign: "center" }}>
          {/* Lock icon */}
          <div style={styles.lockWrap}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 style={{ ...styles.heading, marginTop: 24 }}>
            {featureName || "This feature"} requires authentication
          </h2>
          <p style={{ ...styles.subheading, maxWidth: 360, margin: "8px auto 0" }}>
            Access to technical validation findings is restricted to authorized federal personnel.
          </p>

          {/* Benefits */}
          {benefits && benefits.length > 0 && (
            <div style={styles.benefitsBox}>
              <p style={styles.benefitsTitle}>With federal access</p>
              {benefits.map((b, i) => (
                <div key={i} style={styles.benefitRow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={onRequestAccess}
            style={{ ...styles.submitBtn, width: "100%", marginTop: 28 }}
          >
            Request federal access →
          </button>
          <button
            onClick={onClose}
            style={styles.ghostBtn}
          >
            Continue as public user
          </button>

          <p style={{ ...styles.footer, marginTop: 24 }}>
            Requires a valid .gov or .mil email address
          </p>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// Shared Field component
// ════════════════════════════════════════════════════════

const Field = ({ label, name, type = "text", placeholder, hint, value, onChange, error, required, textarea }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
      <label style={styles.label}>
        {label} {required && <span style={{ color: "#818cf8" }}>*</span>}
      </label>
      {hint && <span style={styles.hint}>{hint}</span>}
    </div>
    {textarea ? (
      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={3}
        style={{
          ...styles.input,
          resize: "vertical",
          minHeight: 80,
          ...(error ? { borderColor: "rgba(248,113,113,0.5)" } : {}),
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
          ...styles.input,
          ...(error ? { borderColor: "rgba(248,113,113,0.5)" } : {}),
        }}
      />
    )}
    {error && <p style={styles.error}>{error}</p>}
  </div>
);

// ════════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════════

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  },
  card: {
    display: "flex",
    maxWidth: 720,
    width: "100%",
    background: "#111318",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
    overflow: "hidden",
  },
  formSide: {
    flex: 1,
    padding: "40px 36px",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },
  stepperSide: {
    width: 180,
    padding: "44px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
    letterSpacing: "-0.02em",
    lineHeight: 1.3,
  },
  subheading: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    margin: "6px 0 24px",
    lineHeight: 1.5,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "0.01em",
  },
  hint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    color: "#f1f5f9",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  error: {
    fontSize: 12,
    color: "#fca5a5",
    marginTop: 4,
    marginBottom: 0,
  },
  statusBox: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid",
    fontSize: 14,
    fontWeight: 500,
  },
  submitBtn: {
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    border: "none",
    borderRadius: 10,
    letterSpacing: "0.01em",
    transition: "opacity 0.2s, transform 0.15s",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  ghostBtn: {
    width: "100%",
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(255,255,255,0.5)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    marginTop: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.2s",
  },
  footer: {
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    marginTop: 20,
    lineHeight: 1.5,
  },
  // Stepper
  stepRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "all 0.3s",
  },
  stepLabel: {
    fontSize: 14,
    transition: "color 0.3s",
  },
  // Access modal
  lockWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.15)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitsBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "16px 20px",
    marginTop: 24,
    textAlign: "left",
  },
  benefitsTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 12,
    marginTop: 0,
  },
  benefitRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
};

// ════════════════════════════════════════════════════════
// 3. Standalone Preview (default export)
// ════════════════════════════════════════════════════════

export default function ModalPreview() {
  const [view, setView] = useState("register"); // 'register' | 'access'

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Toggle bar */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 20 }}>
        {["register", "access"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: view === v ? "rgba(99,102,241,0.15)" : "transparent",
              color: view === v ? "#a5b4fc" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontFamily: "inherit",
              textTransform: "capitalize",
            }}
          >
            {v === "register" ? "Registration Modal" : "Access Required Modal"}
          </button>
        ))}
      </div>

      {view === "register" && <RegistrationModal />}
      {view === "access" && (
        <AccessRequiredModal
          featureName="Technical Findings"
          benefits={[
            "Full validation report with detailed findings",
            "Authorization package templates & checklists",
            "Control mapping to NIST 800-53 framework",
          ]}
          onRequestAccess={() => setView("register")}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
