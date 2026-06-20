import React from 'react';

// ============================================================================
// Trust Center design system primitives
// A small, deliberately constrained kit so the whole Trust Center reads as one
// product: one accent (sky), semantic status colors only, a readable type scale
// (nothing below 11px), generous spacing, hairline borders.
// ============================================================================

export const cn = (...c) => c.filter(Boolean).join(' ');

// Surface tokens — kept here so every panel shares the same material.
export const SURFACE = 'border border-white/[0.07] bg-[#0f0f12]';
export const SURFACE_2 = 'border border-white/[0.06] bg-[#141418]';

// ───────── Eyebrow (small uppercase label) ─────────
export const Eyebrow = ({ children, className = '' }) => (
    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500', className)}>
        {children}
    </div>
);

// ───────── Card ─────────
export const Card = ({ className = '', children, ...rest }) => (
    <div className={cn('rounded-2xl', SURFACE, className)} {...rest}>{children}</div>
);

// ───────── Badge ─────────
const BADGE_VARIANTS = {
    neutral: 'bg-white/[0.04] text-slate-300 border-white/10',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    info: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
};
export const Badge = ({ variant = 'neutral', icon: Icon, children, className = '' }) => (
    <span className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral, className,
    )}>
        {Icon && <Icon className="w-3 h-3" />}
        {children}
    </span>
);

// ───────── Section header ─────────
export const SectionHeader = ({ icon: Icon, title, desc, action, accent = 'text-sky-400' }) => (
    <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
            {Icon && (
                <div className="mt-0.5 shrink-0 p-2 rounded-xl bg-white/[0.04] border border-white/10">
                    <Icon className={cn('w-4 h-4', accent)} />
                </div>
            )}
            <div className="min-w-0">
                <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
                {desc && <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>}
            </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

// ───────── Stat card ─────────
export const StatCard = ({ label, value, sub, accent = 'text-white', icon: Icon, children }) => (
    <div className={cn('rounded-2xl p-5', SURFACE)}>
        <div className="flex items-center justify-between">
            <Eyebrow>{label}</Eyebrow>
            {Icon && <Icon className="w-4 h-4 text-slate-600" />}
        </div>
        <div className={cn('mt-3 text-[28px] leading-none font-bold font-mono tracking-tight', accent)}>{value}</div>
        {sub && <div className="mt-2 text-[12px] text-slate-500 leading-snug">{sub}</div>}
        {children}
    </div>
);

// ───────── Key/value fact ─────────
export const Fact = ({ label, value, sub, mono = false }) => (
    <div className={cn('rounded-xl p-4', SURFACE_2)}>
        <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1.5">{label}</div>
        <div className={cn('text-sm font-semibold text-white truncate', mono && 'font-mono')} title={typeof value === 'string' ? value : undefined}>{value}</div>
        {sub && <div className="text-[12px] text-sky-400/80 mt-0.5">{sub}</div>}
    </div>
);

// ───────── Sparkline (dependency-free SVG) ─────────
export const Sparkline = ({ data, width = 132, height = 36, stroke = '#34d399' }) => {
    const id = React.useId();
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((d, i) => [
        (i / (data.length - 1)) * width,
        height - ((d - min) / span) * (height - 6) - 3,
    ]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.25" fill={stroke} />
        </svg>
    );
};

// ───────── Segmented bar (composition) ─────────
export const SegmentBar = ({ segments, height = 'h-2.5' }) => {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    return (
        <div className={cn('flex rounded-full overflow-hidden bg-white/[0.04]', height)}>
            {segments.filter(s => s.value > 0).map((s, i) => (
                <div key={i} className="h-full transition-all hover:opacity-80"
                    style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                    title={`${s.label}: ${s.value}`} />
            ))}
        </div>
    );
};
