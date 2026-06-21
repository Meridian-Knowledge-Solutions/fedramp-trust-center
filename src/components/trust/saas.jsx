import React from 'react';

// ============================================================================
// Modern enterprise SaaS design system
// Light canvas, Inter type, an indigo→violet brand gradient, soft layered
// elevation, rounded-2xl surfaces, tasteful tinted accents. The vocabulary of
// a premium product UI (Vanta / Linear / Untitled UI lineage).
// ============================================================================

export const cn = (...c) => c.filter(Boolean).join(' ');

// Layered, soft shadows — the key to "modern SaaS" depth.
export const SHADOW_SM = 'shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_-1px_rgba(16,24,40,0.08)]';
export const SHADOW_MD = 'shadow-[0_4px_10px_-2px_rgba(16,24,40,0.08),0_2px_6px_-2px_rgba(16,24,40,0.05)]';
export const SHADOW_LG = 'shadow-[0_20px_40px_-12px_rgba(16,24,40,0.14),0_8px_16px_-8px_rgba(16,24,40,0.06)]';

export const GradientText = ({ children, className = '' }) => (
    <span className={cn('bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent', className)}>{children}</span>
);

export const Eyebrow = ({ children, className = '' }) => (
    <span className={cn('inline-block text-[12px] font-semibold uppercase tracking-[0.14em] text-indigo-600', className)}>{children}</span>
);

export const Card = ({ className = '', hover = false, children, ...p }) => (
    <div className={cn('bg-white border border-gray-200/70 rounded-2xl', SHADOW_SM,
        hover && 'transition-all duration-200 hover:shadow-[0_16px_32px_-12px_rgba(16,24,40,0.16)] hover:-translate-y-0.5 hover:border-gray-300/70',
        className)} {...p}>{children}</div>
);

const BADGE = {
    brand: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    gray: 'bg-gray-100 text-gray-600 ring-gray-500/15',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};
export const Badge = ({ variant = 'gray', icon: Icon, children, className = '' }) => (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset', BADGE[variant], className)}>
        {Icon && <Icon className="w-3.5 h-3.5" />}{children}
    </span>
);

export const GRADIENTS = {
    indigo: 'from-indigo-500 to-violet-500',
    violet: 'from-violet-500 to-fuchsia-500',
    sky: 'from-sky-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
};
export const IconChip = ({ icon: Icon, gradient = 'indigo', size = 'w-10 h-10', iconCls = 'w-5 h-5', className = '' }) => (
    <div className={cn('inline-flex items-center justify-center rounded-xl bg-gradient-to-br text-white', size, GRADIENTS[gradient] || gradient, SHADOW_SM, className)}>
        <Icon className={iconCls} />
    </div>
);

export const Button = ({ variant = 'primary', icon: Icon, iconRight: IconRight, children, className = '', ...p }) => {
    const v = {
        primary: 'text-white bg-gradient-to-b from-indigo-500 to-indigo-600 hover:to-indigo-700 shadow-[0_1px_2px_rgba(16,24,40,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]',
        secondary: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 ' + SHADOW_SM,
        ghost: 'text-gray-600 hover:bg-gray-100',
    };
    return (
        <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.98]', v[variant], className)} {...p}>
            {Icon && <Icon className="w-4 h-4" />}{children}{IconRight && <IconRight className="w-4 h-4" />}
        </button>
    );
};

export const SectionHeading = ({ eyebrow, title, subtitle, action, className = '' }) => (
    <div className={cn('flex items-end justify-between gap-4 flex-wrap mb-6', className)}>
        <div>
            {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
            <h2 className="text-[22px] md:text-[26px] font-bold text-gray-900 tracking-tight leading-tight">{title}</h2>
            {subtitle && <p className="text-[15px] text-gray-500 mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

export const StatCard = ({ icon, gradient = 'indigo', label, value, sub, badge, footer, accent = 'text-gray-900' }) => (
    <Card className="p-5" hover>
        <div className="flex items-start justify-between">
            {icon && <IconChip icon={icon} gradient={gradient} />}
            {badge}
        </div>
        <div className={cn('mt-4 text-[30px] font-bold tracking-tight leading-none', accent)}>{value}</div>
        <div className="mt-2 text-[13px] font-semibold text-gray-600">{label}</div>
        {sub && <div className="mt-0.5 text-[12px] text-gray-400">{sub}</div>}
        {footer && <div className="mt-3 pt-3 border-t border-gray-100">{footer}</div>}
    </Card>
);

export const Stat = ({ label, value, sub, mono = false }) => (
    <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{label}</div>
        <div className={cn('text-[15px] font-semibold text-gray-900 truncate', mono && 'font-mono')} title={typeof value === 'string' ? value : undefined}>{value}</div>
        {sub && <div className="text-[12px] text-indigo-500 mt-0.5">{sub}</div>}
    </div>
);

// ───────── Sparkline ─────────
export const Sparkline = ({ data, width = 120, height = 36, color = '#6366f1' }) => {
    const id = React.useId();
    if (!data || data.length < 2) return null;
    const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
    const pts = data.map((d, i) => [(i / (data.length - 1)) * width, height - ((d - min) / span) * (height - 6) - 3]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient></defs>
            <path d={area} fill={`url(#${id})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
        </svg>
    );
};

// ───────── Donut (compliance %) ─────────
export const Donut = ({ value = 0, size = 132, stroke = 12, label = 'compliant' }) => {
    const id = React.useId();
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - value / 100);
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" />
            </linearGradient></defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2ff" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-gray-900 font-bold" style={{ fontSize: size * 0.2 }}>{value}%</text>
            <text x="50%" y="63%" textAnchor="middle" dominantBaseline="central" className="fill-gray-400 font-medium" style={{ fontSize: size * 0.085, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</text>
        </svg>
    );
};

// ───────── Stacked proportion bar ─────────
export const StackBar = ({ segments, height = 'h-2.5', rounded = true }) => {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    return (
        <div className={cn('flex w-full overflow-hidden bg-gray-100', height, rounded && 'rounded-full')}>
            {segments.filter(s => s.value > 0).map((s, i) => (
                <div key={i} className="h-full transition-all hover:opacity-90" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} />
            ))}
        </div>
    );
};

// ───────── Hero mesh-gradient backdrop ─────────
export const HeroMesh = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
        <div className="absolute -top-40 -left-20 w-[520px] h-[520px] rounded-full opacity-70" style={{ background: 'radial-gradient(circle, #c7d2fe 0%, transparent 62%)' }} />
        <div className="absolute -top-32 right-10 w-[460px] h-[460px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #e9d5ff 0%, transparent 62%)' }} />
        <div className="absolute -bottom-40 left-1/3 w-[420px] h-[420px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 62%)' }} />
        <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.05) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse at top, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 75%)',
        }} />
    </div>
);
