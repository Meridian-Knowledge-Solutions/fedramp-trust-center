import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { API_CONFIG } from './api';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * VerifyHandler
 * 
 * Intercepts the email verification callback URL and completes the auth flow.
 * 
 * Expected URL patterns from the verification email:
 *   /?token=<jwt_or_verification_code>
 *   /?verify=<code>&email=<email>
 * 
 * Flow:
 *   1. Detects token/verify param in URL on mount
 *   2. POSTs to /verify endpoint
 *   3. Passes response to handleVerifyResponse() which stores JWT in localStorage
 *   4. Cleans URL params so refresh doesn't re-trigger
 */
const VerifyHandler = () => {
  const { handleVerifyResponse, isAuthenticated } = useAuth();
  const [verifyState, setVerifyState] = useState('idle'); // idle | verifying | success | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Don't re-verify if already authenticated
    if (isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);

    // Support multiple possible param names from the backend email link
    const token = params.get('token') || params.get('verify') || params.get('code');
    const email = params.get('email'); // Some backends require the email alongside the code

    if (!token) return; // No verification params present — normal page load

    const verifyEmail = async () => {
      setVerifyState('verifying');

      try {
        // Build the request payload
        // Supports both { token } and { token, email } patterns
        const payload = { token };
        if (email) payload.email = email;

        console.log('[VerifyHandler] Calling /verify with payload keys:', Object.keys(payload));

        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();
        console.log('[VerifyHandler] /verify response status:', response.status);
        console.log('[VerifyHandler] /verify response keys:', Object.keys(data));

        if (!response.ok) {
          throw new Error(data.error || data.message || `Verification failed (${response.status})`);
        }

        // --- CRITICAL: This is the missing link ---
        // handleVerifyResponse reads data.fedRAMPAccessToken, validates the JWT,
        // stores it in localStorage, and sets the user in AuthContext.
        const stored = handleVerifyResponse(data);

        if (stored) {
          console.log('[VerifyHandler] JWT stored successfully');
          setVerifyState('success');

          // Clean the URL so a refresh doesn't re-trigger verification
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);

          // Auto-dismiss after a moment
          setTimeout(() => setVerifyState('idle'), 3000);
        } else {
          // handleVerifyResponse returned false — token was missing or failed validation
          console.error('[VerifyHandler] handleVerifyResponse returned false');
          console.error('[VerifyHandler] Check: does the response contain fedRAMPAccessToken?', !!data.fedRAMPAccessToken);

          // If the backend returned a token but useAuth rejected it, log why
          if (data.fedRAMPAccessToken) {
            try {
              const parts = data.fedRAMPAccessToken.split('.');
              const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              const now = Date.now() / 1000;
              console.error('[VerifyHandler] Token exp:', payload.exp, '| Now:', now, '| Diff (s):', payload.exp - now);
              if (!payload.exp) {
                console.error('[VerifyHandler] Token has no exp claim — validateToken will reject it');
              } else if (payload.exp <= now) {
                console.error('[VerifyHandler] Token is already expired at time of receipt — check server clock skew');
              }
            } catch (e) {
              console.error('[VerifyHandler] Could not decode token for debugging:', e);
            }
          }

          setVerifyState('error');
          setErrorMessage('Token validation failed. The token may be expired or malformed.');
        }
      } catch (err) {
        console.error('[VerifyHandler] Verification error:', err);
        setVerifyState('error');
        setErrorMessage(err.message || 'Verification failed. Please try again or request a new link.');
      }
    };

    verifyEmail();
  }, [handleVerifyResponse, isAuthenticated]);

  // --- Render nothing for idle state ---
  if (verifyState === 'idle') return null;

  // --- Verification overlay UI ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="max-w-md w-full mx-4 bg-[#121217] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">

        {verifyState === 'verifying' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Loader2 size={40} className="text-blue-400 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verifying Your Access</h3>
            <p className="text-sm text-slate-400">Confirming your federal agency credentials...</p>
          </>
        )}

        {verifyState === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <CheckCircle size={40} className="text-emerald-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Access Verified</h3>
            <p className="text-sm text-slate-400">Welcome. You now have authenticated federal access.</p>
          </>
        )}

        {verifyState === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <XCircle size={40} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
            <p className="text-sm text-slate-400 mb-4">{errorMessage}</p>
            <button
              onClick={() => {
                setVerifyState('idle');
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
              }}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyHandler;
