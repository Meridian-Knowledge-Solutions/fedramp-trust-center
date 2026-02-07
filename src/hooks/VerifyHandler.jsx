import { useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth';
import { API_CONFIG } from '../config/api';

/**
 * VerifyHandler — GitHub Pages + API Gateway Compatible
 * 
 * THE PROBLEM:
 * On GitHub Pages SPAs, the verification email link can arrive in several formats,
 * and GitHub Pages can strip/mangle query params. This handler accounts for ALL of them.
 * 
 * SUPPORTED URL PATTERNS (all will be detected):
 * 
 *   1. Query param on app URL:
 *      https://org.github.io/repo/?token=abc123
 *      https://org.github.io/repo/?verify=abc123&email=user@agency.gov
 * 
 *   2. Hash-based (GitHub Pages 404 redirect workaround):
 *      https://org.github.io/repo/#/?token=abc123
 *      https://org.github.io/repo/#/verify?token=abc123
 * 
 *   3. API Gateway redirect — backend redirects browser back to app with token:
 *      https://org.github.io/repo/?fedRAMPAccessToken=<full_jwt>
 *      (backend already verified, just store the JWT directly)
 * 
 *   4. Direct JWT in URL (backend did verification server-side, appends JWT):
 *      https://org.github.io/repo/?jwt=<full_jwt>
 * 
 * FLOW:
 *   - On mount, parse ALL possible param sources (search, hash)
 *   - If a verification code is found -> POST to /verify -> store JWT
 *   - If a raw JWT is found -> validate and store directly (skip /verify call)
 *   - Clean URL after processing
 */

// --- Utility: Extract params from all possible URL locations ---
const extractVerifyParams = () => {
  const results = {
    token: null,
    email: null,
    directJwt: null,
    source: null,
  };

  // 1. Standard query string: ?token=abc
  const searchParams = new URLSearchParams(window.location.search);
  
  // 2. Hash-based params: #/?token=abc or #/verify?token=abc  
  let hashParams = new URLSearchParams();
  const hash = window.location.hash;
  if (hash.includes('?')) {
    hashParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
  }

  // Check for verification code (needs /verify API call)
  for (const params of [searchParams, hashParams]) {
    const token = params.get('token') || params.get('verify') || params.get('code');
    if (token) {
      results.token = token;
      results.email = params.get('email');
      results.source = params === searchParams ? 'query_string' : 'hash_params';
      break;
    }
  }

  // Check for direct JWT (backend already verified, skip /verify call)
  // A JWT always has 3 dot-separated parts and is much longer than a verification code
  for (const params of [searchParams, hashParams]) {
    const jwt = params.get('fedRAMPAccessToken') || params.get('jwt') || params.get('access_token');
    if (jwt && jwt.split('.').length === 3) {
      results.directJwt = jwt;
      results.source = params === searchParams ? 'direct_jwt_query' : 'direct_jwt_hash';
      break;
    }
  }

  return results;
};

// --- Utility: Clean verification params from URL without page reload ---
const cleanUrl = () => {
  try {
    const url = new URL(window.location.href);
    // Remove verify-related params from query string
    ['token', 'verify', 'code', 'email', 'fedRAMPAccessToken', 'jwt', 'access_token'].forEach(p => {
      url.searchParams.delete(p);
    });
    // Clean hash if it had params
    if (url.hash.includes('?')) {
      url.hash = url.hash.substring(0, url.hash.indexOf('?'));
    }
    // If hash is just '#' or '#/', normalize
    if (url.hash === '#' || url.hash === '#/') {
      url.hash = '';
    }
    window.history.replaceState({}, document.title, url.toString());
  } catch (e) {
    // Fallback: just strip to pathname
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// --- Debug helper: decode and log JWT issues ---
function debugToken(jwt) {
  try {
    const parts = jwt.split('.');
    console.log('[VerifyHandler] Token parts count:', parts.length);
    if (parts.length !== 3) {
      console.error('[VerifyHandler] Not a valid JWT (expected 3 parts)');
      return;
    }
    const header = JSON.parse(window.atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Date.now() / 1000;

    console.log('[VerifyHandler] JWT Header:', header);
    console.log('[VerifyHandler] JWT Payload:', payload);
    console.log('[VerifyHandler] JWT exp:', payload.exp, '| now:', now);

    if (!payload.exp) {
      console.error('[VerifyHandler] WARNING: Token has NO exp claim');
    } else if (payload.exp <= now) {
      console.error('[VerifyHandler] WARNING: Token EXPIRED ' + (now - payload.exp).toFixed(1) + 's ago');
    } else {
      console.log('[VerifyHandler] Token valid for ' + (payload.exp - now).toFixed(0) + 's more');
    }

    if (payload.iat) {
      console.log('[VerifyHandler] Token issued ' + (now - payload.iat).toFixed(1) + 's ago');
    }
  } catch (e) {
    console.error('[VerifyHandler] Could not decode JWT for debugging:', e);
  }
}

const VerifyHandler = () => {
  const { handleVerifyResponse, isAuthenticated } = useAuth();
  const [state, setState] = useState('idle'); // idle | verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const hasRun = useRef(false); // Prevent double-run in React StrictMode

  useEffect(() => {
    // Guard: don't run twice (React StrictMode), don't run if already authed
    if (hasRun.current || isAuthenticated) return;

    const params = extractVerifyParams();

    console.log('[VerifyHandler] URL inspection:', {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      pathname: window.location.pathname,
      extracted: params,
    });

    // --- PATH A: Direct JWT (backend already verified) ---
    if (params.directJwt) {
      hasRun.current = true;
      console.log('[VerifyHandler] Direct JWT found via:', params.source);
      setState('verifying');

      // Wrap in fake response shape that handleVerifyResponse expects
      const stored = handleVerifyResponse({ fedRAMPAccessToken: params.directJwt });

      if (stored) {
        console.log('[VerifyHandler] Direct JWT stored successfully');
        setState('success');
        cleanUrl();
        setTimeout(() => setState('idle'), 2500);
      } else {
        console.error('[VerifyHandler] Direct JWT rejected by validateToken');
        debugToken(params.directJwt);
        setState('error');
        setErrorMsg('The access token could not be validated. It may be expired.');
        cleanUrl();
      }
      return;
    }

    // --- PATH B: Verification code (needs /verify API call) ---
    if (params.token) {
      hasRun.current = true;
      console.log('[VerifyHandler] Verification code found via:', params.source, '| code length:', params.token.length);
      setState('verifying');

      const payload = { token: params.token };
      if (params.email) payload.email = params.email;

      const verifyUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.VERIFY;
      console.log('[VerifyHandler] POSTing to:', verifyUrl);
      console.log('[VerifyHandler] Payload:', JSON.stringify(payload));

      fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          const text = await res.text();
          console.log('[VerifyHandler] /verify response status:', res.status);
          console.log('[VerifyHandler] /verify raw response (first 500 chars):', text.substring(0, 500));

          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            throw new Error('Backend returned non-JSON response: ' + text.substring(0, 200));
          }

          if (!res.ok) {
            throw new Error(data.error || data.message || 'Verification failed (HTTP ' + res.status + ')');
          }

          console.log('[VerifyHandler] /verify response keys:', Object.keys(data));
          console.log('[VerifyHandler] Has fedRAMPAccessToken:', !!data.fedRAMPAccessToken);

          // Check all possible token field names the backend might use
          const tokenValue = data.fedRAMPAccessToken || data.token || data.access_token || data.jwt || data.accessToken;
          
          if (!data.fedRAMPAccessToken && tokenValue) {
            console.warn('[VerifyHandler] Token found under non-standard key. Normalizing.');
            data.fedRAMPAccessToken = tokenValue;
          }

          // --- THE CRITICAL LINE: Store the JWT ---
          const stored = handleVerifyResponse(data);

          if (stored) {
            console.log('[VerifyHandler] JWT stored in localStorage successfully');
            // Double-check it's actually there
            const check = localStorage.getItem('fedRAMPAccessToken');
            console.log('[VerifyHandler] localStorage verification:', check ? 'Present (' + check.length + ' chars)' : 'MISSING');
            setState('success');
            cleanUrl();
            setTimeout(() => setState('idle'), 2500);
          } else {
            console.error('[VerifyHandler] handleVerifyResponse returned false');
            if (data.fedRAMPAccessToken) {
              debugToken(data.fedRAMPAccessToken);
            } else {
              console.error('[VerifyHandler] Response did NOT contain fedRAMPAccessToken.');
              console.error('[VerifyHandler] Available keys:', Object.keys(data));
              console.error('[VerifyHandler] Full response:', JSON.stringify(data, null, 2));
            }
            setState('error');
            setErrorMsg('Token validation failed after verification. Check browser console for details.');
          }
        })
        .catch((err) => {
          console.error('[VerifyHandler] Fetch error:', err);
          setState('error');
          setErrorMsg(err.message);
        });

      return;
    }

    // --- PATH C: No verification params found ---
    console.debug('[VerifyHandler] No verification params in URL — normal page load');
  }, [handleVerifyResponse, isAuthenticated]);

  // --- Render ---
  if (state === 'idle') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        maxWidth: '420px', width: '100%', margin: '0 16px',
        background: '#121217', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '32px', textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {state === 'verifying' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', margin: '0 auto',
                border: '3px solid rgba(59,130,246,0.3)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'verifyHandlerSpin 0.8s linear infinite',
              }} />
            </div>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Verifying Your Access
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Confirming your federal agency credentials...
            </p>
            <style>{'@keyframes verifyHandlerSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={{
              width: '48px', height: '48px', margin: '0 auto 16px',
              background: 'rgba(16,185,129,0.1)', borderRadius: '12px',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
            }}>
              &#10003;
            </div>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Access Verified
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Welcome. You now have authenticated federal access.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{
              width: '48px', height: '48px', margin: '0 auto 16px',
              background: 'rgba(239,68,68,0.1)', borderRadius: '12px',
              border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', color: '#ef4444',
            }}>
              &#10007;
            </div>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Verification Failed
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              {errorMsg}
            </p>
            <button
              onClick={() => { setState('idle'); cleanUrl(); }}
              style={{
                padding: '10px 24px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                color: 'white', fontSize: '14px', cursor: 'pointer',
              }}
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
