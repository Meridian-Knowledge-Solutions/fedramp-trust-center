import React from 'react';

// ============================================================================
// "AUTHORIZATION DOSSIER" — design system
// An original editorial identity for the Trust Center: warm paper, ink type,
// serif display, monospace data, hairline rules, restrained federal navy with a
// single oxblood "stamp" accent. Deliberately NOT a dark dashboard.
// ============================================================================

export const cn = (...c) => c.filter(Boolean).join(' ');

// Palette (kept here as the single source of truth)
export const C = {
    paper: '#f3f1ea',     // page
    panel: '#fbfaf6',     // raised sheet
    ink: '#1c1b17',       // primary text
    sub: '#6c685f',       // secondary text
    faint: '#928d81',     // tertiary
    rule: 'rgba(28,27,23,0.13)',
    navy: '#1e3a5f',      // accent (links, figures, active)
    oxblood: '#8c2f2f',   // stamp only
    good: '#2f6b46',
    warn: '#8a5e1c',
    customer: '#9a6a1e',
    shared: '#1e3a5f',
    meridian: '#2f6b46',
    inherited: '#5b4b8a',
};

export const RULE = 'border-[#1c1b17]/[0.13]';
export const PANEL = 'bg-[#fbfaf6]';

// ───────── Kicker (small uppercase eyebrow) ─────────
export const Kicker = ({ children, className = '' }) => (
    <span className={cn('text-[11px] uppercase tracking-[0.22em] font-semibold text-[#6c685f]', className)}>{children}</span>
);

// ───────── Hairline rule ─────────
export const Rule = ({ className = '' }) => <div className={cn('border-t', RULE, className)} />;

// ───────── Official stamp ─────────
export const Stamp = ({ children = 'Authorized' }) => (
    <span
        className="inline-flex items-center justify-center border-[2.5px] border-[#8c2f2f]/65 text-[#8c2f2f]/90 uppercase tracking-[0.24em] text-[12px] font-bold px-3.5 py-1.5 -rotate-[4deg] select-none"
        style={{ boxShadow: 'inset 0 0 0 1.5px rgba(140,47,47,0.18)', borderRadius: 2 }}
    >
        {children}
    </span>
);

// ───────── Tag ─────────
const TONES = {
    ink: 'border-[#1c1b17]/25 text-[#3a382f]',
    navy: 'border-[#1e3a5f]/35 text-[#1e3a5f] bg-[#1e3a5f]/[0.05]',
    good: 'border-[#2f6b46]/35 text-[#2f6b46] bg-[#2f6b46]/[0.05]',
    warn: 'border-[#8a5e1c]/40 text-[#8a5e1c] bg-[#8a5e1c]/[0.05]',
    oxblood: 'border-[#8c2f2f]/35 text-[#8c2f2f] bg-[#8c2f2f]/[0.04]',
};
export const Tag = ({ children, tone = 'ink', className = '', mono = false }) => (
    <span className={cn('inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium leading-none rounded-sm',
        mono && 'font-mono', TONES[tone] || TONES.ink, className)}>{children}</span>
);

// ───────── Figure (large numeric) ─────────
export const Figure = ({ value, label, sub, accent = false }) => (
    <div>
        <div className={cn('font-serif text-[34px] leading-none tracking-tight', accent ? 'text-[#1e3a5f]' : 'text-[#1c1b17]')}>{value}</div>
        <div className="mt-2.5 text-[11px] uppercase tracking-[0.12em] text-[#6c685f] font-semibold">{label}</div>
        {sub && <div className="mt-1 text-[12.5px] text-[#807b70] leading-snug">{sub}</div>}
    </div>
);

// ───────── Definition row (ledger key/value) ─────────
export const DefRow = ({ label, value, sub, mono = false }) => (
    <div className={cn('flex items-baseline justify-between gap-6 py-2.5 border-t', RULE)}>
        <span className="text-[11px] uppercase tracking-[0.1em] text-[#6c685f] font-semibold shrink-0 pt-0.5">{label}</span>
        <span className="text-right min-w-0">
            <span className={cn('text-[14px] text-[#1c1b17]', mono && 'font-mono')}>{value}</span>
            {sub && <span className="block text-[12px] text-[#807b70]">{sub}</span>}
        </span>
    </div>
);

// ───────── Section shell (numbered, anchored) ─────────
export const Section = React.forwardRef(({ id, num, title, desc, action, children }, ref) => (
    <section id={id} ref={ref} className="scroll-mt-8 pt-2">
        <div className="flex items-end justify-between gap-4 mb-7">
            <div className="flex items-baseline gap-4 min-w-0">
                <span className="font-mono text-[13px] text-[#1e3a5f] font-semibold pt-1 shrink-0">{num}</span>
                <div className="min-w-0">
                    <h2 className="font-serif text-[26px] md:text-[30px] text-[#1c1b17] tracking-tight leading-[1.1]">{title}</h2>
                    {desc && <p className="text-[13px] text-[#6c685f] mt-1.5 max-w-2xl leading-relaxed">{desc}</p>}
                </div>
            </div>
            {action && <div className="shrink-0 hidden sm:block">{action}</div>}
        </div>
        {children}
    </section>
));

// ───────── Sheet (raised paper block) ─────────
export const Sheet = ({ className = '', children }) => (
    <div className={cn('border rounded-sm', RULE, PANEL, className)}>{children}</div>
);

// ───────── Proportion bar (composition) ─────────
export const ProportionBar = ({ segments, height = 'h-6' }) => {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    return (
        <div className={cn('flex w-full overflow-hidden border', height, RULE)} style={{ borderRadius: 2 }}>
            {segments.filter(s => s.value > 0).map((s, i) => (
                <div key={i} className="h-full flex items-center justify-center transition-all"
                    style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                    title={`${s.label}: ${s.value}`}>
                    {(s.value / total) > 0.08 && (
                        <span className="text-[10px] font-mono font-semibold text-white/95">{s.value}</span>
                    )}
                </div>
            ))}
        </div>
    );
};

// ───────── Sparkline (dependency-free, light) ─────────
export const Sparkline = ({ data, width = 128, height = 34, stroke = C.navy }) => {
    const id = React.useId();
    if (!data || data.length < 2) return null;
    const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
    const pts = data.map((d, i) => [(i / (data.length - 1)) * width, height - ((d - min) / span) * (height - 6) - 3]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.18" /><stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient></defs>
            <path d={area} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={stroke} />
        </svg>
    );
};
