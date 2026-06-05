// Lightweight hash-based deep-linking for the Trust Center.
//
// Route format:  #<view>[/<tab>[/<section>]]
//   e.g.  #trust              → Trust Center
//         #trust/compliance   → Trust Center, Compliance & CRM tab
//         #trust/compliance/cmmc → …CMMC/CUI/DoD section
//
// VerifyHandler owns any hash that contains '?' (e.g. #/verify?token=…),
// so those are deliberately ignored here to avoid colliding with the
// federal access verification flow.

export function getRouteSegments() {
    if (typeof window === 'undefined') return [];
    const raw = window.location.hash.replace(/^#\/?/, '');
    if (!raw || raw.includes('?')) return [];
    return raw.split('/').filter(Boolean);
}

// Write the given path segments to the URL hash (no-op if unchanged so we
// don't trigger redundant hashchange events).
export function setRoute(segments) {
    if (typeof window === 'undefined') return;
    const path = segments.filter(Boolean).join('/');
    const next = path ? `#${path}` : '';
    if (window.location.hash !== next) {
        // Use replaceState when clearing so we don't push an empty entry.
        window.location.hash = next;
    }
}

// Subscribe to hash changes; returns an unsubscribe function.
export function onRouteChange(handler) {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
}
