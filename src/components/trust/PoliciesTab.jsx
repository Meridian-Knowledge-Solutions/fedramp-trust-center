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
  <div className="prose prose-invert prose-sm max-w-none
    prose-headings:text-white prose-headings:tracking-tight
    prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b prose-h1:border-white/10
    prose-h2:text-lg prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3
    prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6
    prose-p:text-slate-300 prose-p:leading-relaxed
    prose-li:text-slate-300 prose-li:marker:text-slate-500
    prose-strong:text-white
    prose-code:text-blue-400 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:border prose-code:border-blue-500/20
    prose-table:border-collapse
    prose-th:bg-white/5 prose-th:text-slate-300 prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:p-3 prose-th:border prose-th:border-white/10
    prose-td:p-3 prose-td:border prose-td:border-white/10 prose-td:text-slate-400 prose-td:text-sm
  ">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
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

  useEffect(() => {
    if (filteredPolicies.length === 0) {
      setPolicyContent('');
      return;
    }

    const policy = filteredPolicies[selectedIndex] || filteredPolicies[0];
    if (!policy) return;

    const loadContent = async () => {
      setContentLoading(true);
      try {
        const res = await fetch(getFileUrl(policy.path));
        if (res.ok) {
          const text = await res.text();
          setPolicyContent(text);
        } else {
          setPolicyContent('> Policy document could not be loaded.');
        }
      } catch {
        setPolicyContent('> Error loading policy document.');
      } finally {
        setContentLoading(false);
      }
    };

    loadContent();
  }, [selectedIndex, filteredPolicies, getFileUrl]);

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
            <h2 className="text-white font-bold text-lg tracking-tight">Security Policies</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-mono">
              {policies.length} document{policies.length !== 1 ? 's' : ''} from security-governance repository
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
