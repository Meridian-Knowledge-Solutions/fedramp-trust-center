export const Sanitizer = {
    // ✅ Matches logic from determineKsiStatus in index.html
    determineStatus: (validation) => {
        // Handle missing data gracefully
        if (!validation) return 'unknown';

        const assertion = validation.assertion;
        // Check assertion_reason OR message (some APIs use different keys)
        const reason = (validation.assertion_reason || validation.message || '').toLowerCase();

        // 1. Failures (Explicit False)
        if (assertion === false || assertion === "false") return 'failed';

        // 2. Successes (Explicit True)
        if (assertion === true || assertion === "true") {
            // Check for soft warnings inside the success message
            if (reason.includes('warning') || reason.includes('⚠️')) return 'warning';
            if (reason.includes('info') || reason.includes('ℹ️') || reason.includes('context')) return 'info';
            return 'passed';
        }

        // 3. Fallback
        return 'unknown';
    },

    // ✅ Matches mapStatusForPublic in index.html
    // Used by the Grid to determine colors/icons
    mapStatus: (status) => {
        const map = {
            'passed': { label: 'Compliant', icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50' },
            'failed': { label: 'Remediation', icon: 'XCircle', color: 'text-red-600', bg: 'bg-red-50' },
            'warning': { label: 'Low Risk', icon: 'AlertTriangle', color: 'text-amber-600', bg: 'bg-amber-50' },
            'info': { label: 'Context', icon: 'Info', color: 'text-blue-600', bg: 'bg-blue-50' },
            'unknown': { label: 'Unknown', icon: 'HelpCircle', color: 'text-slate-400', bg: 'bg-slate-100' }
        };

        // Returns the config object. The Component will render the actual Icon.
        return map[status] || map['unknown'];
    },

    // ✅ Matches sanitizeAssertionReason in index.html
    // Scrub sensitive IPs/data from public view
    sanitizeReason: (text) => {
        if (!text) return "Assessment completed.";
        let clean = text;

        const rules = [
            { p: /subnet \d+\.\d+\.\d+\.\d+\/\d+/gi, r: "network environments" },
            { p: /aws [a-z-]+ [a-z-]+.*/gi, r: "validation commands" },
            { p: /ip-\d+-\d+-\d+-\d+/gi, r: "internal-resource" }
        ];

        rules.forEach(rule => {
            clean = clean.replace(rule.p, rule.r);
        });

        return clean.replace(/[✅❌⚠️ℹ️]/g, '').trim();
    }
};