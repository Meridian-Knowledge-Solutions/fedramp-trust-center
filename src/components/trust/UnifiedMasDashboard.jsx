import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Shield, Server, Users, MessageSquare, DollarSign, Box,
    AlertTriangle, RefreshCw, Layers, Cloud, Activity,
    CheckCircle, XCircle, Zap, ChevronDown, ChevronUp,
    ExternalLink, Info, Lock, Database, Eye, Settings,
    FileText, Building, CreditCard, Radio, Wifi, WifiOff,
    CircleDot, Signal, SignalHigh, SignalLow, SignalMedium
} from 'lucide-react';

// Load from local public/data (same pattern as other components)
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data/`
    : `${import.meta.env.BASE_URL}/data/`;

const CATEGORY_CONFIG = {
    infrastructure: {
        icon: Cloud,
        label: 'Cloud Infrastructure',
        color: '#3b82f6',
        gradient: 'from-blue-500 to-blue-600',
        description: 'Core cloud computing resources'
    },
    identity: {
        icon: Shield,
        label: 'Identity & Access',
        color: '#a855f7',
        gradient: 'from-purple-500 to-purple-600',
        description: 'Authentication and authorization systems'
    },
    hr: {
        icon: Users,
        label: 'Human Resources',
        color: '#f59e0b',
        gradient: 'from-amber-500 to-amber-600',
        description: 'Personnel management and onboarding'
    },
    collaboration: {
        icon: MessageSquare,
        label: 'Collaboration',
        color: '#06b6d4',
        gradient: 'from-cyan-500 to-cyan-600',
        description: 'Team communication and workflows'
    },
    financial: {
        icon: DollarSign,
        label: 'Financial Health',
        color: '#10b981',
        gradient: 'from-emerald-500 to-emerald-600',
        description: 'Billing, costs, and financial stability'
    },
    application: {
        icon: Box,
        label: 'Core Application',
        color: '#f43f5e',
        gradient: 'from-rose-500 to-rose-600',
        description: 'Application components and services'
    },
    monitoring: {
        icon: Activity,
        label: 'Monitoring & Logging',
        color: '#8b5cf6',
        gradient: 'from-violet-500 to-violet-600',
        description: 'Observability and audit systems'
    },
    security: {
        icon: Lock,
        label: 'Security Services',
        color: '#ec4899',
        gradient: 'from-pink-500 to-pink-600',
        description: 'Security tools and compliance'
    },
    // Third-party integration categories (FRR-MAS-02/03)
    content_library: {
        icon: FileText,
        label: 'Content Library',
        color: '#22d3ee',
        gradient: 'from-cyan-400 to-cyan-500',
        description: 'Third-party learning content providers'
    },
    authoring_tool: {
        icon: Settings,
        label: 'Authoring Tools',
        color: '#a78bfa',
        gradient: 'from-violet-400 to-violet-500',
        description: 'Content creation and authoring'
    },
    virtual_meeting: {
        icon: Radio,
        label: 'Virtual Meeting',
        color: '#34d399',
        gradient: 'from-emerald-400 to-emerald-500',
        description: 'Video conferencing and virtual classroom'
    },
    devops: {
        icon: Database,
        label: 'DevOps',
        color: '#fb923c',
        gradient: 'from-orange-400 to-orange-500',
        description: 'Source code and CI/CD pipelines'
    },
    compliance: {
        icon: Shield,
        label: 'Compliance',
        color: '#60a5fa',
        gradient: 'from-blue-400 to-blue-500',
        description: 'Compliance data and reporting'
    }
};

const STATUS_COLORS = {
    healthy: '#10b981',
    warning: '#f59e0b',
    critical: '#f43f5e',
    unknown: '#64748b'
};

const CIA_COLORS = {
    High: '#94a3b8',      // Subtle slate for all - monochromatic
    Moderate: '#64748b',
    Low: '#475569'
};

// ============================================
// Subtle Badge Components - Monochromatic design
// ============================================
const ConnectionStatusBadge = ({ connected, health, size = 'normal', showLabel = true }) => {
    const sizeClasses = {
        small: { badge: 'px-2 py-0.5 text-[9px] gap-1', dot: 'w-1.5 h-1.5' },
        normal: { badge: 'px-2.5 py-1 text-[10px] gap-1.5', dot: 'w-1.5 h-1.5' },
        large: { badge: 'px-3 py-1.5 text-xs gap-2', dot: 'w-2 h-2' }
    };

    const s = sizeClasses[size];

    if (connected) {
        return (
            <div className={`flex items-center rounded-full font-medium ${s.badge} bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/30`}>
                <div className="relative flex items-center justify-center">
                    <div className={`${s.dot} rounded-full bg-emerald-400`} />
                </div>
                {showLabel && <span>LIVE</span>}
            </div>
        );
    }

    return (
        <div className={`flex items-center rounded-full font-medium ${s.badge} bg-slate-500/10 text-slate-500 border border-slate-500/20`}>
            <div className={`${s.dot} rounded-full bg-slate-500`} />
            {showLabel && <span>OFFLINE</span>}
        </div>
    );
};

// CIA Impact Badge - Subtle inline design
const CIABadge = ({ impact }) => {
    if (!impact) return null;

    const getOpacity = (level) => {
        if (level === 'High') return 'opacity-100';
        if (level === 'Moderate' || level === 'Mod') return 'opacity-60';
        return 'opacity-30';
    };

    return (
        <div className="flex items-center gap-px bg-slate-800/50 rounded px-1 py-0.5">
            {['C', 'I', 'A'].map((letter) => (
                <span
                    key={letter}
                    className={`text-[9px] font-mono text-slate-400 px-1 ${getOpacity(impact[letter])}`}
                    title={`${letter === 'C' ? 'Confidentiality' : letter === 'I' ? 'Integrity' : 'Availability'}: ${impact[letter]}`}
                >
                    {letter}
                </span>
            ))}
        </div>
    );
};

// Third-Party Status Badge - Minimal text
const ThirdPartyBadge = ({ isThirdParty, isAuthorized }) => {
    if (!isThirdParty) {
        return <span className="text-[9px] text-slate-500">Internal</span>;
    }

    if (isAuthorized) {
        return (
            <span className="text-[9px] text-slate-400 flex items-center gap-1">
                <CheckCircle size={10} className="text-emerald-500/70" />
                FedRAMP
            </span>
        );
    }

    return (
        <span className="text-[9px] text-slate-400 flex items-center gap-1">
            <AlertTriangle size={10} className="text-amber-500/70" />
            Non-FedRAMP
        </span>
    );
};

// Animated Flow Line Component
const FlowLine = ({ startX, startY, endX, endY, color, thickness = 3, animated = true, dimmed = false }) => {
    const midX = (startX + endX) / 2;
    const controlY1 = startY;
    const controlY2 = endY;

    const path = `M ${startX} ${startY} C ${midX} ${controlY1}, ${midX} ${controlY2}, ${endX} ${endY}`;

    return (
        <g>
            {/* Glow effect */}
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={thickness + 6}
                strokeOpacity={dimmed ? 0.03 : 0.12}
                strokeLinecap="round"
            />
            {/* Main line */}
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                strokeOpacity={dimmed ? 0.15 : 0.5}
                strokeLinecap="round"
            />
            {/* Animated particles */}
            {animated && !dimmed && (
                <>
                    <circle r="5" fill={color} opacity="0.9">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
                    </circle>
                    <circle r="5" fill={color} opacity="0.9">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="0.8s" />
                    </circle>
                    <circle r="5" fill={color} opacity="0.9">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="1.6s" />
                    </circle>
                </>
            )}
        </g>
    );
};

// ============================================
// System Node Component - PROMINENT connection status
// ============================================
const SystemNode = ({ x, y, system, isHovered, onHover, onLeave, awsServices }) => {
    const config = CATEGORY_CONFIG[system.category] || CATEGORY_CONFIG.application;
    const Icon = config.icon;
    const isConnected = system.connected;
    const statusColor = isConnected ? STATUS_COLORS[system.health] || STATUS_COLORS.unknown : STATUS_COLORS.unknown;

    // For AWS node, count actual services instead of generic resource count
    const isAWS = system.id === 'aws' && awsServices;
    const serviceCount = isAWS ? Object.keys(awsServices).length : system.resource_count;
    const displayLabel = isAWS ? 'services' : 'resources';

    return (
        <g
            transform={`translate(${x}, ${y})`}
            onMouseEnter={() => onHover(system.id)}
            onMouseLeave={onLeave}
            style={{ cursor: 'pointer' }}
        >
            {/* Outer glow on hover */}
            {isHovered && (
                <circle
                    r="65"
                    fill="none"
                    stroke={config.color}
                    strokeWidth="2"
                    opacity="0.6"
                >
                    <animate attributeName="r" values="60;68;60" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
            )}

            {/* PROMINENT: Animated connection ring for connected systems */}
            {isConnected && (
                <>
                    {/* Outer pulse ring */}
                    <circle
                        r="58"
                        fill="none"
                        stroke={statusColor}
                        strokeWidth="2"
                        opacity="0.3"
                    >
                        <animate attributeName="r" values="55;62;55" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Rotating dashed ring */}
                    <circle
                        r="55"
                        fill="none"
                        stroke={statusColor}
                        strokeWidth="2"
                        strokeDasharray="12 6"
                        opacity="0.5"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0"
                            to="360"
                            dur="15s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </>
            )}

            {/* Background circle */}
            <circle
                r="50"
                fill="#18181b"
                stroke={isHovered ? config.color : (isConnected ? statusColor : '#374151')}
                strokeWidth={isHovered ? 3 : 2}
                opacity={isConnected ? 1 : 0.5}
            />

            {/* Status indicator ring - resource progress */}
            {isConnected && (
                <circle
                    r="44"
                    fill="none"
                    stroke={statusColor}
                    strokeWidth="4"
                    strokeDasharray={`${Math.min((serviceCount / 40) * 276, 276)} 276`}
                    transform="rotate(-90)"
                    opacity="0.7"
                    strokeLinecap="round"
                />
            )}

            {/* Inner content */}
            <foreignObject x="-40" y="-40" width="80" height="80">
                <div className="flex flex-col items-center justify-center h-full">
                    <Icon size={24} color={isConnected ? config.color : '#64748b'} />
                    <div className={`text-base font-bold mt-1 ${isConnected ? 'text-white' : 'text-slate-500'}`}>
                        {serviceCount || 0}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-wide">{displayLabel}</div>
                </div>
            </foreignObject>

            {/* Drift badge */}
            {system.drift_count > 0 && (
                <g transform="translate(35, -35)">
                    <circle r="14" fill="#f59e0b" />
                    <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="black"
                        fontSize="11"
                        fontWeight="bold"
                    >
                        {system.drift_count}
                    </text>
                </g>
            )}

            {/* Connection status indicator */}
            <g transform="translate(0, 62)">
                <foreignObject x="-32" y="-10" width="64" height="20">
                    <div className="flex justify-center">
                        {isConnected ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-[8px] font-medium text-emerald-400/90">LIVE</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/30 border border-slate-600/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span className="text-[8px] font-medium text-slate-500">OFFLINE</span>
                            </div>
                        )}
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};

// ============================================
// Integration Node Component - Third-party integrations (FRR-MAS-02/03)
// Visually distinct: smaller, dashed border, muted colors
// ============================================
const IntegrationNode = ({ x, y, integration, isHovered, onHover, onLeave }) => {
    const config = CATEGORY_CONFIG[integration.category] || CATEGORY_CONFIG.application;
    const Icon = config.icon;
    const isAuthorized = integration.is_fedramp_authorized;

    return (
        <g
            transform={`translate(${x}, ${y})`}
            onMouseEnter={() => onHover(integration.id)}
            onMouseLeave={onLeave}
            style={{ cursor: 'pointer' }}
        >
            {/* Hover glow */}
            {isHovered && (
                <circle
                    r="42"
                    fill="none"
                    stroke={config.color}
                    strokeWidth="1.5"
                    opacity="0.5"
                />
            )}

            {/* Dashed outer ring - indicates "documented" status */}
            <circle
                r="38"
                fill="none"
                stroke={isHovered ? config.color : '#475569'}
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.6"
            />

            {/* Background circle - darker, more muted */}
            <circle
                r="32"
                fill="#0f0f14"
                stroke={isHovered ? config.color : '#374151'}
                strokeWidth={isHovered ? 2 : 1}
                opacity="0.9"
            />

            {/* Inner content */}
            <foreignObject x="-28" y="-28" width="56" height="56">
                <div className="flex flex-col items-center justify-center h-full">
                    <Icon size={18} color={isHovered ? config.color : '#64748b'} />
                    <div className="text-[8px] text-slate-500 mt-1 text-center leading-tight max-w-[52px] truncate">
                        {integration.connection_type || 'API'}
                    </div>
                </div>
            </foreignObject>

            {/* FedRAMP indicator - subtle */}
            <g transform="translate(24, -24)">
                {isAuthorized ? (
                    <circle r="8" fill="#0f0f14" stroke="#10b981" strokeWidth="1.5" opacity="0.8" />
                ) : (
                    <circle r="8" fill="#0f0f14" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />
                )}
                <foreignObject x="-6" y="-6" width="12" height="12">
                    <div className="flex items-center justify-center h-full">
                        {isAuthorized ? (
                            <CheckCircle size={10} className="text-emerald-500" />
                        ) : (
                            <AlertTriangle size={10} className="text-amber-500" />
                        )}
                    </div>
                </foreignObject>
            </g>

            {/* Status indicator - "DOCUMENTED" */}
            <g transform="translate(0, 44)">
                <foreignObject x="-32" y="-8" width="64" height="16">
                    <div className="flex justify-center">
                        <span className="text-[7px] font-medium text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                            CONFIGURED
                        </span>
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};

// Integration Tooltip - Enhanced with full metadata from mas_architecture_map.json
// FRR-MAS-05: Information flows and CIA impact documented
const IntegrationTooltip = ({ integration, x, y, svgHeight = 720, onMouseEnter, onMouseLeave }) => {
    const config = CATEGORY_CONFIG[integration.category] || CATEGORY_CONFIG.application;
    const tooltipWidth = 300;

    // Calculate dynamic height based on content
    const hasControls = !integration.is_fedramp_authorized && integration.compensating_controls;
    const hasDataFlow = integration.data_flow;
    const tooltipHeight = 220 + (hasControls ? 50 : 0) + (hasDataFlow ? 60 : 0);

    // Smart positioning - prefer right side, but flip if needed
    let tooltipX = x + 55;
    let tooltipY = y - tooltipHeight / 2;

    // Flip to left if would overflow right
    if (tooltipX + tooltipWidth > 880) {
        tooltipX = x - tooltipWidth - 55;
    }

    // Clamp vertical position to stay in view
    if (tooltipY < 10) tooltipY = 10;
    if (tooltipY + tooltipHeight > svgHeight - 10) {
        tooltipY = svgHeight - tooltipHeight - 10;
    }

    // Risk level styling
    const riskColors = {
        low: 'text-emerald-400',
        medium: 'text-amber-400',
        high: 'text-rose-400'
    };

    // Data flow classification styling (FRR-MAS-05)
    const classificationColors = {
        'federal-disseminated': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
        'federal-collected': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
        'federal-processed': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
        'non-federal': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' },
    };

    const flowStyle = classificationColors[integration.data_flow?.classification] || classificationColors['non-federal'];

    return (
        <foreignObject x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight + 20}
            onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ pointerEvents: 'all' }}>
            <div className="bg-[#13131a] border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-3 py-2.5 bg-slate-800/30 border-b border-slate-700/30">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${config.color}15` }}>
                            {React.createElement(config.icon, { size: 14, color: config.color })}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm truncate">{integration.name}</div>
                            <div className="text-slate-500 text-[10px]">{integration.status || 'Configured'}</div>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="px-3 py-2 space-y-2">
                    {/* Connection & Auth Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-[9px] text-slate-600 uppercase tracking-wide">Connection</div>
                            <div className="text-[11px] text-slate-300">{integration.connection_type || 'API'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-600 uppercase tracking-wide">Auth Method</div>
                            <div className="text-[11px] text-slate-300">{integration.auth_method || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Risk & Status Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-[9px] text-slate-600 uppercase tracking-wide">Risk Level</div>
                            <div className={`text-[11px] capitalize ${riskColors[integration.risk] || 'text-slate-400'}`}>
                                {integration.risk || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] text-slate-600 uppercase tracking-wide">FedRAMP</div>
                            <div className="flex items-center gap-1">
                                {integration.is_fedramp_authorized ? (
                                    <>
                                        <CheckCircle size={10} className="text-emerald-500" />
                                        <span className="text-[11px] text-emerald-400">Authorized</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle size={10} className="text-amber-500" />
                                        <span className="text-[11px] text-amber-400">Commercial</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Data Flow Classification (FRR-MAS-05) */}
                    {integration.data_flow && (
                        <div className={`rounded p-2 ${flowStyle.bg} border ${flowStyle.border}`}>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Data Flow (FRR-MAS-05)</div>
                            <div className={`text-[10px] font-medium ${flowStyle.text}`}>
                                {integration.data_flow.classification?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            {integration.data_flow.direction && (
                                <div className="text-[9px] text-slate-500 mt-0.5">
                                    Direction: {integration.data_flow.direction}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PII Shared */}
                    {integration.pii_shared?.length > 0 && (
                        <div>
                            <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-1">PII Shared</div>
                            <div className="flex flex-wrap gap-1">
                                {integration.pii_shared.map((pii, idx) => (
                                    <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-800/80 text-slate-400 rounded">
                                        {pii}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CIA Impact */}
                    {integration.cia_impact && (
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-1">CIA Impact</div>
                                <CIABadge impact={integration.cia_impact} />
                            </div>
                        </div>
                    )}

                    {/* Compensating Controls for non-FedRAMP */}
                    {!integration.is_fedramp_authorized && integration.compensating_controls && (
                        <div className="pt-1.5 border-t border-slate-700/30">
                            <div className="text-[9px] text-amber-500/80 leading-relaxed">
                                <span className="font-medium">Compensating Controls:</span>{' '}
                                <span className="text-slate-500">{integration.compensating_controls}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </foreignObject>
    );
};

// Central Hub Component - Redesigned for clarity
const CentralHub = ({ health, totalSystems, connectedSystems, totalResources, totalDrift, totalIntegrations = 0 }) => {
    const statusColor = STATUS_COLORS[health] || STATUS_COLORS.unknown;
    const totalScope = totalSystems + totalIntegrations;

    return (
        <g>
            {/* Outer animated rings */}
            <circle r="100" fill="none" stroke={statusColor} strokeWidth="1" opacity="0.2">
                <animate attributeName="r" values="95;105;95" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle r="110" fill="none" stroke={statusColor} strokeWidth="1" opacity="0.1">
                <animate attributeName="r" values="105;115;105" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </circle>

            {/* Main hub circle */}
            <circle
                r="90"
                fill="url(#hubGradient)"
                stroke={statusColor}
                strokeWidth="3"
            />

            {/* Progress ring showing connected ratio */}
            <circle
                r="82"
                fill="none"
                stroke={statusColor}
                strokeWidth="6"
                strokeDasharray={`${(connectedSystems / totalSystems) * 515} 515`}
                transform="rotate(-90)"
                opacity="0.4"
                strokeLinecap="round"
            />

            {/* Content */}
            <foreignObject x="-75" y="-75" width="150" height="150">
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">Connected</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">{connectedSystems}</span>
                        <span className="text-lg text-slate-500">/ {totalSystems}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">systems</div>

                    {/* Integrations count */}
                    {totalIntegrations > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full border border-dashed border-slate-500" />
                            <span className="text-[9px] text-slate-400">
                                +{totalIntegrations} integrations
                            </span>
                        </div>
                    )}
                </div>
            </foreignObject>
        </g>
    );
};

// Enhanced Tooltip Component with CIA Impact and AWS Services
const SystemTooltip = ({ system, x, y, awsServices, onMouseEnter, onMouseLeave }) => {
    const config = CATEGORY_CONFIG[system.category] || CATEGORY_CONFIG.application;
    const isAWS = system.id === 'aws' && awsServices;
    const tooltipHeight = isAWS ? 340 : 220;
    const tooltipY = y > 320 ? y - tooltipHeight - 10 : y + 70;
    const tooltipX = x > 600 ? x - 300 : x < 200 ? x + 20 : x - 150;

    // Get top services by cost for AWS
    const topServices = isAWS
        ? Object.entries(awsServices)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => name.replace('Amazon ', '').replace('AWS ', ''))
        : [];

    return (
        <foreignObject x={tooltipX} y={tooltipY} width="300" height={tooltipHeight}
            onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ pointerEvents: 'all' }}>
            <div className="bg-[#1a1a1f] border border-white/20 rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: system.connected ? STATUS_COLORS[system.health] : '#64748b' }} />
                        <div>
                            <div className="text-white font-semibold text-sm">{system.name}</div>
                            <div className="text-slate-500 text-[10px]">{config.label}</div>
                        </div>
                    </div>
                    <ConnectionStatusBadge connected={system.connected} health={system.health} size="small" />
                </div>

                {/* AWS Services List */}
                {isAWS && topServices.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-white/10">
                        <div className="text-[10px] text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Cloud size={10} />
                            Active Services ({Object.keys(awsServices).length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {topServices.map((service, idx) => (
                                <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                >
                                    {service}
                                </span>
                            ))}
                            {Object.keys(awsServices).length > 8 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-500/15 text-slate-400">
                                    +{Object.keys(awsServices).length - 8} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* CIA Impact Display */}
                {system.cia_impact && (
                    <div className="mb-3 pb-3 border-b border-white/10">
                        <div className="text-[10px] text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                            <Info size={10} />
                            CIA Impact (FRR-MAS-05)
                        </div>
                        <div className="flex items-center justify-between">
                            <CIABadge impact={system.cia_impact} />
                            <ThirdPartyBadge isThirdParty={system.is_third_party} isAuthorized={system.is_fedramp_authorized} />
                        </div>
                        {system.cia_impact.rationale && (
                            <div className="text-[9px] text-slate-400 mt-2 leading-relaxed">{system.cia_impact.rationale}</div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase">Health</div>
                        <div className="text-sm font-medium capitalize" style={{ color: STATUS_COLORS[system.health] }}>
                            {system.health || 'Unknown'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase">{isAWS ? 'Services' : 'Resources'}</div>
                        <div className="text-sm font-bold text-white">{isAWS ? Object.keys(awsServices).length : (system.resource_count || 0)}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase">Drift Items</div>
                        <div className={`text-sm font-bold ${system.drift_count > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {system.drift_count || 0}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase">Data Source</div>
                        <div className="text-sm text-slate-300 truncate">{system.data_source || 'API'}</div>
                    </div>
                </div>
            </div>
        </foreignObject>
    );
};

// ============================================
// AWS Services Panel - Shows ALL services (no pricing)
// ============================================
const AWSServicesPanel = ({ services, isExpanded, onToggle }) => {
    if (!services || Object.keys(services).length === 0) return null;

    const sortedServices = Object.entries(services)
        .sort((a, b) => b[1] - a[1])
        .map(([name, cost]) => ({ name, cost }));

    return (
        <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <Cloud size={18} className="text-slate-400" />
                    <span className="text-white font-medium">AWS Services</span>
                    <span className="text-slate-500 text-sm">{sortedServices.length} in scope</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600">FRR-MAS-01</span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-white/5">
                    <div className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                            {sortedServices.map((service, idx) => {
                                const isSecurityService = service.name.includes('WAF') ||
                                    service.name.includes('Firewall') ||
                                    service.name.includes('GuardDuty') ||
                                    service.name.includes('Security') ||
                                    service.name.includes('Inspector') ||
                                    service.name.includes('KMS');

                                return (
                                    <div
                                        key={idx}
                                        className={`px-2 py-1 rounded text-xs ${isSecurityService
                                                ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                                                : 'bg-slate-800/50 text-slate-400'
                                            }`}
                                        title={`$${service.cost.toFixed(2)}/mo`}
                                    >
                                        {service.name.replace('Amazon ', '').replace('AWS ', '')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// Systems Inventory Panel - Cleaned up with subtle badges
// ============================================
const SystemsInventoryPanel = ({ systems, isExpanded, onToggle }) => {
    if (!systems || systems.length === 0) return null;

    const connectedCount = systems.filter(s => s.connected).length;
    const categories = [...new Set(systems.map(s => s.category))];

    return (
        <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <Layers size={18} className="text-slate-400" />
                    <span className="text-white font-medium">Information Resources</span>
                    <span className="text-slate-500 text-sm">{systems.length} systems</span>
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{connectedCount} connected</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600">FRR-MAS-01</span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-white/5 max-h-[400px] overflow-y-auto">
                    {categories.map(category => {
                        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.application;
                        const Icon = config.icon;
                        const categorySystems = systems.filter(s => s.category === category);

                        return (
                            <div key={category} className="border-b border-white/5 last:border-b-0">
                                <div className="px-5 py-2.5 bg-[#0c0c10] flex items-center gap-2">
                                    <Icon size={14} className="text-slate-500" />
                                    <span className="text-sm font-medium text-slate-300">{config.label}</span>
                                    <span className="text-[10px] text-slate-600">({categorySystems.length})</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {categorySystems.map((system, idx) => (
                                        <div key={idx} className="px-5 py-3 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${system.connected ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                                                    <span className="text-white text-sm">{system.name}</span>
                                                    <ThirdPartyBadge isThirdParty={system.is_third_party} isAuthorized={system.is_fedramp_authorized} />
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    {system.cia_impact && <CIABadge impact={system.cia_impact} />}
                                                    <span>{system.resource_count || 0} resources</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ============================================
// Main Dashboard Component
// ============================================
export const UnifiedMasDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredSystem, setHoveredSystem] = useState(null);
    const [hoveredIntegration, setHoveredIntegration] = useState(null);
    const hoverSystemTimerRef = React.useRef(null);
    const hoverIntegrationTimerRef = React.useRef(null);

    // Delayed leave handlers to allow mouse to travel from node to tooltip
    const handleSystemHover = useCallback((id) => {
        if (hoverSystemTimerRef.current) {
            clearTimeout(hoverSystemTimerRef.current);
            hoverSystemTimerRef.current = null;
        }
        setHoveredSystem(id);
    }, []);

    const handleSystemLeave = useCallback(() => {
        hoverSystemTimerRef.current = setTimeout(() => {
            setHoveredSystem(null);
        }, 150);
    }, []);

    const handleIntegrationHover = useCallback((id) => {
        if (hoverIntegrationTimerRef.current) {
            clearTimeout(hoverIntegrationTimerRef.current);
            hoverIntegrationTimerRef.current = null;
        }
        setHoveredIntegration(id);
    }, []);

    const handleIntegrationLeave = useCallback(() => {
        hoverIntegrationTimerRef.current = setTimeout(() => {
            setHoveredIntegration(null);
        }, 150);
    }, []);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (hoverSystemTimerRef.current) clearTimeout(hoverSystemTimerRef.current);
            if (hoverIntegrationTimerRef.current) clearTimeout(hoverIntegrationTimerRef.current);
        };
    }, []);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [awsExpanded, setAwsExpanded] = useState(true);
    const [inventoryExpanded, setInventoryExpanded] = useState(false);
    const [integrationsExpanded, setIntegrationsExpanded] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BASE_PATH}mas_dashboard.json?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
            const json = await response.json();
            setData(json);
            setLastRefresh(new Date());
            console.log('✅ Unified MAS Dashboard loaded:', json.health?.connected_systems, 'systems connected');
        } catch (err) {
            console.error('❌ Failed to load MAS dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Calculate node positions - adaptive based on system count
    const nodePositions = useMemo(() => {
        if (!data?.systems) return [];
        const systems = data.systems;
        const centerX = 450;
        const centerY = 320;
        const baseRadius = 190;

        // Adjust radius based on number of systems
        const radius = systems.length > 6 ? baseRadius + (systems.length - 6) * 15 : baseRadius;

        return systems.map((system, index) => {
            const angle = (index * 2 * Math.PI / systems.length) - Math.PI / 2;
            return {
                ...system,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
    }, [data?.systems]);

    // Calculate integration positions - outer ring
    const integrationPositions = useMemo(() => {
        if (!data?.integrations) return [];
        const integrations = data.integrations;
        const centerX = 450;
        const centerY = 320;
        const systemCount = data?.systems?.length || 6;
        const baseRadius = systemCount > 6 ? 190 + (systemCount - 6) * 15 : 190;
        const outerRadius = baseRadius + 130; // Outer ring for integrations

        return integrations.map((integration, index) => {
            // Offset angle to place integrations between system nodes
            const angle = (index * 2 * Math.PI / integrations.length) - Math.PI / 2 + (Math.PI / integrations.length);
            return {
                ...integration,
                x: centerX + outerRadius * Math.cos(angle),
                y: centerY + outerRadius * Math.sin(angle)
            };
        });
    }, [data?.integrations, data?.systems?.length]);

    const totalResources = useMemo(() =>
        (data?.systems || []).reduce((sum, s) => sum + (s.resource_count || 0), 0),
        [data?.systems]
    );

    const totalDrift = useMemo(() =>
        (data?.systems || []).reduce((sum, s) => sum + (s.drift_count || 0), 0),
        [data?.systems]
    );

    // Calculate SVG height dynamically - account for outer integration ring and tooltips
    const svgHeight = useMemo(() => {
        const hasIntegrations = (data?.integrations?.length || 0) > 0;
        // Increased height to accommodate tooltips at bottom of graph
        const baseHeight = hasIntegrations ? 780 : 640;
        const systemCount = data?.systems?.length || 0;
        return systemCount > 6 ? baseHeight + (systemCount - 6) * 30 : baseHeight;
    }, [data?.systems?.length, data?.integrations?.length]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
                    <div className="text-slate-400">Loading Minimum Assessment Scope...</div>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="bg-[#121217] border border-rose-500/30 rounded-xl p-8 text-center">
                <AlertTriangle size={40} className="text-rose-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">Failed to Load Assessment Scope</h3>
                <p className="text-slate-400 text-sm mb-4">{error}</p>
                <button
                    onClick={loadData}
                    className="px-6 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    const hoveredSystemData = hoveredSystem ? nodePositions.find(s => s.id === hoveredSystem) : null;
    const hoveredIntegrationData = hoveredIntegration ? integrationPositions.find(i => i.id === hoveredIntegration) : null;

    // Calculate total scope (systems + integrations)
    const totalScope = (data?.systems?.length || 0) + (data?.integrations?.length || 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats Bar - Clean, subtle design */}
            <div className="bg-[#121217] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-5 flex-wrap">
                        {/* Title with health indicator */}
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${data?.health?.overall === 'healthy' ? 'bg-emerald-500' :
                                    data?.health?.overall === 'warning' ? 'bg-amber-500' :
                                        'bg-rose-500'
                                }`} />
                            <span className="text-white font-semibold text-lg">Minimum Assessment Scope</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                                {data?.health?.overall || 'Unknown'}
                            </span>
                        </div>

                        <div className="h-6 w-px bg-white/10" />

                        {/* Stats - Clean inline layout */}
                        <div className="flex items-center gap-5 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Connected</span>
                                <span className="text-white font-medium">{data?.health?.connected_systems || 0}</span>
                                <span className="text-slate-600">/</span>
                                <span>{data?.health?.total_systems || 0}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span>Resources</span>
                                <span className="text-white font-medium">{totalResources}</span>
                            </div>

                            {totalDrift > 0 && (
                                <div className="flex items-center gap-2">
                                    <span>Drift</span>
                                    <span className="text-amber-400/80 font-medium">{totalDrift}</span>
                                </div>
                            )}

                            {data?.integrations?.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full border border-slate-500 border-dashed" />
                                    <span>Integrations</span>
                                    <span className="text-white font-medium">{data.integrations.length}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[11px] text-slate-500">
                            Updated: {lastRefresh?.toLocaleTimeString() || 'Never'}
                        </span>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-sm text-slate-300"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Visualization - DYNAMIC HEIGHT FIX */}
            <div className="bg-[#0c0c10] border border-white/10 rounded-xl p-6 relative overflow-visible">
                {/* Background grid */}
                <div className="absolute inset-0 opacity-5 rounded-xl overflow-hidden" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />

                <svg
                    width="100%"
                    height={svgHeight}
                    viewBox={`0 0 900 ${svgHeight}`}
                    className="relative z-10"
                    style={{ minHeight: `${svgHeight}px` }}
                >
                    <defs>
                        {/* Hub gradient */}
                        <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </radialGradient>

                        {/* Glow filter */}
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Flow lines from systems to center */}
                    {nodePositions.map((system) => {
                        const config = CATEGORY_CONFIG[system.category] || CATEGORY_CONFIG.application;
                        return (
                            <FlowLine
                                key={`line-${system.id}`}
                                startX={system.x}
                                startY={system.y}
                                endX={450}
                                endY={300}
                                color={system.connected ? config.color : '#374151'}
                                thickness={system.connected ? Math.max(3, Math.min(10, system.resource_count / 6)) : 2}
                                animated={system.connected}
                                dimmed={hoveredSystem && hoveredSystem !== system.id}
                            />
                        );
                    })}

                    {/* Central Hub */}
                    <g transform="translate(450, 320)">
                        <CentralHub
                            health={data?.health?.overall}
                            totalSystems={data?.health?.total_systems || 0}
                            connectedSystems={data?.health?.connected_systems || 0}
                            totalResources={totalResources}
                            totalDrift={totalDrift}
                            totalIntegrations={data?.integrations?.length || 0}
                        />
                    </g>

                    {/* System Nodes */}
                    {nodePositions.map((system) => (
                        <SystemNode
                            key={system.id}
                            x={system.x}
                            y={system.y}
                            system={system}
                            isHovered={hoveredSystem === system.id}
                            onHover={handleSystemHover}
                            onLeave={handleSystemLeave}
                            awsServices={data?.aws_services}
                        />
                    ))}

                    {/* System Labels */}
                    {nodePositions.map((system) => {
                        const config = CATEGORY_CONFIG[system.category] || CATEGORY_CONFIG.application;
                        const labelOffset = system.y > 320 ? 95 : -85;
                        return (
                            <text
                                key={`label-${system.id}`}
                                x={system.x}
                                y={system.y + labelOffset}
                                textAnchor="middle"
                                fill={hoveredSystem === system.id ? config.color : '#94a3b8'}
                                fontSize="13"
                                fontWeight="600"
                                className="transition-all duration-200"
                            >
                                {system.name}
                            </text>
                        );
                    })}

                    {/* Integration Nodes - Outer ring (FRR-MAS-02/03) */}
                    {integrationPositions.map((integration) => (
                        <IntegrationNode
                            key={integration.id}
                            x={integration.x}
                            y={integration.y}
                            integration={integration}
                            isHovered={hoveredIntegration === integration.id}
                            onHover={handleIntegrationHover}
                            onLeave={handleIntegrationLeave}
                        />
                    ))}

                    {/* Integration Labels */}
                    {integrationPositions.map((integration) => {
                        const config = CATEGORY_CONFIG[integration.category] || CATEGORY_CONFIG.application;
                        const labelOffset = integration.y > 320 ? 62 : -58;
                        return (
                            <text
                                key={`int-label-${integration.id}`}
                                x={integration.x}
                                y={integration.y + labelOffset}
                                textAnchor="middle"
                                fill={hoveredIntegration === integration.id ? config.color : '#64748b'}
                                fontSize="10"
                                fontWeight="500"
                                className="transition-all duration-200"
                            >
                                {integration.name.length > 18 ? integration.name.slice(0, 16) + '...' : integration.name}
                            </text>
                        );
                    })}

                    {/* System Tooltip */}
                    {hoveredSystemData && (
                        <SystemTooltip
                            system={hoveredSystemData}
                            x={hoveredSystemData.x}
                            y={hoveredSystemData.y}
                            awsServices={data?.aws_services}
                            onMouseEnter={() => handleSystemHover(hoveredSystemData.id)}
                            onMouseLeave={handleSystemLeave}
                        />
                    )}

                    {/* Integration Tooltip */}
                    {hoveredIntegrationData && (
                        <IntegrationTooltip
                            integration={hoveredIntegrationData}
                            x={hoveredIntegrationData.x}
                            y={hoveredIntegrationData.y}
                            svgHeight={svgHeight}
                            onMouseEnter={() => handleIntegrationHover(hoveredIntegrationData.id)}
                            onMouseLeave={handleIntegrationLeave}
                        />
                    )}
                </svg>

                {/* Legend - Updated with integration style */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between flex-wrap gap-4 text-[11px] z-20">
                    <div className="flex items-center gap-5 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                            <span className="text-slate-400">Connected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-600" />
                            <span className="text-slate-500">Offline</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-dashed border-slate-500 bg-transparent" />
                            <span className="text-slate-500">Integration</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-bold text-black">!</div>
                            <span className="text-slate-500">Drift</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm text-slate-500">
                        <CheckCircle size={12} className="text-emerald-500/70" />
                        <span>FedRAMP</span>
                        <AlertTriangle size={12} className="text-amber-500/70 ml-2" />
                        <span>Non-FedRAMP</span>
                    </div>
                </div>
            </div>

            {/* AWS Services Panel - Shows ALL services */}
            {data?.aws_services && (
                <AWSServicesPanel
                    services={data.aws_services}
                    isExpanded={awsExpanded}
                    onToggle={() => setAwsExpanded(!awsExpanded)}
                />
            )}

            {/* Systems Inventory Panel */}
            {data?.systems && (
                <SystemsInventoryPanel
                    systems={data.systems}
                    isExpanded={inventoryExpanded}
                    onToggle={() => setInventoryExpanded(!inventoryExpanded)}
                />
            )}

            {/* Drift Summary Panel - Subtle design */}
            {(data?.drift_summary?.length || 0) > 0 && (
                <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3">
                        <AlertTriangle size={16} className="text-amber-500/70" />
                        <span className="text-white font-medium">Configuration Drift</span>
                        <span className="text-slate-500 text-sm">{data.drift_summary.length} items</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-[#0c0c10] sticky top-0 z-10">
                                <tr className="text-[10px] text-slate-600 uppercase">
                                    <th className="px-5 py-2.5 text-left font-medium">Source</th>
                                    <th className="px-5 py-2.5 text-left font-medium">Type</th>
                                    <th className="px-5 py-2.5 text-left font-medium">Description</th>
                                    <th className="px-5 py-2.5 text-left font-medium">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.drift_summary.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-2.5">
                                            <span className="text-slate-300 text-sm">{item.source}</span>
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <span className="text-slate-500 text-sm">{item.type}</span>
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <span className="text-slate-400 text-sm">{item.description}</span>
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <span className={`text-[10px] ${item.severity === 'critical' ? 'text-rose-400' :
                                                    item.severity === 'warning' ? 'text-amber-400/80' :
                                                        'text-slate-500'
                                                }`}>
                                                {item.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FedRAMP MAS Compliance Footer */}
            <div className="bg-[#121217] border border-white/10 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <FileText size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
                        <div><strong className="text-blue-400">FRR-MAS-01:</strong> <span className="text-slate-400">Cloud Service Offering includes all information resources (machine AND non-machine) likely to handle or impact CIA of federal customer data.</span></div>
                        <div><strong className="text-purple-400">FRR-MAS-02:</strong> <span className="text-slate-400">Third-party information resources are included and monitored.</span></div>
                        <div><strong className="text-amber-400">FRR-MAS-03:</strong> <span className="text-slate-400">Non-FedRAMP authorized third-party resources documented with justification and compensating controls.</span></div>
                        <div><strong className="text-cyan-400">FRR-MAS-04:</strong> <span className="text-slate-400">Metadata about federal customer data included in assessment scope.</span></div>
                        <div><strong className="text-emerald-400">FRR-MAS-05:</strong> <span className="text-slate-400">Information flows and CIA impact levels documented for ALL resources.</span></div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Fingerprint: <span className="text-slate-400 font-mono">{data?.meta?.fingerprint || 'N/A'}</span></span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Version 25.11C • Phase 2 Pilot Ready</span>
                    <span>Generated: <span className="text-slate-400">{data?.meta?.generated_at ? new Date(data.meta.generated_at).toLocaleString() : 'N/A'}</span></span>
                </div>
            </div>
        </div>
    );
};

export default UnifiedMasDashboard;
