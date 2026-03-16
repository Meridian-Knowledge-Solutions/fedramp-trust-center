import React, { useState, useEffect, memo } from 'react';
import { FileText, ChevronRight, BookOpen, Search, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useTrustCenterData } from '../../hooks/useTrustCenterData';

const THEME = {
  panel: 'bg-[#121217]',
  border: 'border-white/10',
};

const PolicyCard = memo(({ policy, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group cursor-pointer ${
      isSelected
        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
        : `${THEME.panel} ${THEME.border} hover:border-white/20 text-slate-300 hover:text-white`
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg border ${
        isSelected
          ? 'bg-blue-500/15 border-blue-500/30'
          : 'bg-white/5 border-white/5 group-hover:border-white/10'
      }`}>
        <FileText size={16} className={isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm tracking-tight">{policy.title}</div>
        <div className="text-[11px] text-slate-500 mt-1 font-mono">{policy.filename}</div>
      </div>
      <ChevronRight size={14} className={`mt-1 transition-transform ${isSelected ? 'text-blue-400 rotate-90' : 'text-slate-600'}`} />
    </div>
  </button>
));

const MarkdownRenderer = memo(({ content }) => (
  <div className="max-w-none text-slate-300 text-sm leading-relaxed">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-white tracking-tight mb-6 pb-3 border-b border-white/10">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-white tracking-tight mt-10 mb-4 pb-2 border-b border-white/5">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-white mt-8 mb-3">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-slate-200 mt-6 mb-2">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-slate-300 leading-relaxed mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-1.5 text-slate-300 marker:text-slate-600">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-slate-300 marker:text-slate-500">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-slate-300 leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-slate-200">{children}</em>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-500/30 hover:decoration-blue-400/60 transition-colors">{children}</a>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className={`block bg-[#09090b] text-emerald-400 text-xs font-mono rounded-lg p-4 my-4 overflow-x-auto border border-white/5 leading-relaxed whitespace-pre ${className || ''}`} {...props}>{children}</code>
            );
          }
          return (
            <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs border border-blue-500/20 font-mono" {...props}>{children}</code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-[#09090b] rounded-lg my-4 overflow-x-auto border border-white/5">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-blue-500/40 pl-4 my-4 text-slate-400 italic">{children}</blockquote>
        ),
        hr: () => (
          <hr className="border-white/10 my-8" />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/5">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left text-slate-300 text-xs uppercase tracking-wider font-bold p-3 border-b border-white/10">{children}</th>
        ),
        td: ({ children }) => (
          <td className="p-3 border-b border-white/5 text-slate-400">{children}</td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>
        ),
        img: ({ src, alt }) => (
          <img src={src} alt={alt} className="rounded-lg border border-white/10 my-4 max-w-full" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
));

export const PoliciesTab = memo(() => {
  const { policies, getFileUrl, loading, error } = useTrustCenterData();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [policyContent, setPolicyContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPolicies = policies.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stabilize the selected policy path to avoid re-render loops
  const selectedPolicy = filteredPolicies[selectedIndex] || filteredPolicies[0];
  const selectedPath = selectedPolicy?.path;

  useEffect(() => {
    if (!selectedPath) {
      setPolicyContent('');
      return;
    }

    let cancelled = false;
    const loadContent = async () => {
      setContentLoading(true);
      try {
        const res = await fetch(getFileUrl(selectedPath));
        if (cancelled) return;
        if (res.ok) {
          const text = await res.text();
          if (!cancelled) setPolicyContent(text);
        } else {
          if (!cancelled) setPolicyContent('> Policy document could not be loaded.');
        }
      } catch {
        if (!cancelled) setPolicyContent('> Error loading policy document.');
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };

    loadContent();
    return () => { cancelled = true; };
  }, [selectedPath, getFileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading policies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-8 text-center`}>
        <BookOpen size={40} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">Unable to load policies</p>
        <p className="text-slate-600 text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-8 text-center`}>
        <BookOpen size={40} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">No policy documents available</p>
        <p className="text-slate-600 text-xs mt-1">Policies will appear here after the next pipeline run</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Policies</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-mono">
              Governance Documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20 tracking-wider uppercase">
              Pipeline Synced
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar - Policy List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg ${THEME.panel} border ${THEME.border} text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all`}
            />
          </div>
          <div className="space-y-2">
            {filteredPolicies.map((policy, idx) => (
              <PolicyCard
                key={policy.path}
                policy={policy}
                isSelected={idx === selectedIndex}
                onClick={() => setSelectedIndex(idx)}
              />
            ))}
            {filteredPolicies.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-4">No policies match your search</p>
            )}
          </div>
        </div>

        {/* Main Content - Policy Viewer */}
        <div className="lg:col-span-8">
          <div className={`${THEME.panel} rounded-xl border ${THEME.border} overflow-hidden`}>
            {filteredPolicies.length > 0 && (
              <div className="px-6 py-4 border-b border-white/5 bg-[#09090b] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-blue-400" />
                  <span className="text-white font-medium text-sm">
                    {(filteredPolicies[selectedIndex] || filteredPolicies[0])?.title}
                  </span>
                </div>
                <a
                  href={getFileUrl((filteredPolicies[selectedIndex] || filteredPolicies[0])?.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-wider font-bold"
                >
                  <ExternalLink size={10} />
                  Raw
                </a>
              </div>
            )}
            <div className="p-6 min-h-[400px]">
              {contentLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                <MarkdownRenderer content={policyContent} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
