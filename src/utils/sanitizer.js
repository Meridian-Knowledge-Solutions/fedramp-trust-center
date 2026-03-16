export const Sanitizer = {
    // ✅ Matches logic from determineKsiStatus in index.html
    determineStatus: (validation) => {
        // Handle missing data gracefully
        if (!validation) return 'unknown';

        const assertion = validation.assertion;
        const reason = validation.assertion_reason || validation.message || '';

        // 1. Failures (Explicit False)
        if (assertion === false || assertion === "false") return 'failed';

        // 2. Successes (Explicit True)
        if (assertion === true || assertion === "true") {
            // Only check the HEADLINE portion for warning/info indicators,
            // not the individual finding items (which use ⚠️/ℹ️ for sub-items).
            // Headline format: "✅ Excellent 10/10 (100%): ✅ [Finding1]...; ✅ [Finding2]..."
            // We extract everything before the first semicolon or the first sub-finding emoji.
            const headlineEnd = reason.search(/[;]/);
            const headline = (headlineEnd > 0 ? reason.slice(0, headlineEnd) : reason).toLowerCase();

            // Check headline only for control-level warning/info signals
            if (headline.includes('warning') || headline.includes('⚠️')) return 'warning';
            if (headline.includes('ℹ️') || headline.includes('context')) return 'info';
            return 'passed';
        }

        // 3. Fallback
        return 'unknown';
    },

    // ✅ Matches mapStatusForPublic in index.html
    // Used by the Grid to determine colors/icons
    mapStatus: (status) => {
        const map = {
            'passed': { label: 'Compliant', icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50', description: 'Control fully meets FedRAMP requirements' },
            'failed': { label: 'Remediation Required', icon: 'XCircle', color: 'text-red-600', bg: 'bg-red-50', description: 'Control failed validation and requires corrective action' },
            'warning': { label: 'Compliant with Conditions', icon: 'AlertTriangle', color: 'text-amber-600', bg: 'bg-amber-50', description: 'Control passes but has conditions or constraints that require ongoing monitoring' },
            'info': { label: 'Informational', icon: 'Info', color: 'text-blue-600', bg: 'bg-blue-50', description: 'Supplementary context — no action required' },
            'unknown': { label: 'Pending Review', icon: 'HelpCircle', color: 'text-slate-400', bg: 'bg-slate-100', description: 'Control status has not been determined' }
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