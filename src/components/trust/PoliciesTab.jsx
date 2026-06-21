import React, { useState, useEffect, memo } from 'react';
import { BookOpen, Search, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useTrustCenterData } from '../../hooks/useTrustCenterData';

// Derive a short governance reference (FRR / NIST family) from a policy's
// filename or path, for the .meta column of each list row.
const policyRef = (policy) => (policy?.filename || policy?.path || '').split('/').pop() || '';

const PolicyCard = memo(({ policy, isSelected, onClick }) => (
  <div
    className="lrow"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    style={isSelected ? { background: '#34E0C40D' } : undefined}
  >
    <div style={{ minWidth: 0 }}>
      <div className="t" style={{ color: isSelected ? 'var(--signal)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {policy.title}
      </div>
      <div className="d" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{policyRef(policy)}</div>
    </div>
    <div className="meta">
      <span className="ar" style={isSelected ? undefined : { color: 'var(--faint)' }}>→</span>
    </div>
  </div>
));

const MarkdownRenderer = memo(({ content }) => (
  <div style={{ color: 'var(--ash)', fontSize: 14, lineHeight: 1.7 }}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        h1: ({ children }) => (
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.03em', color: 'var(--ink)', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginTop: 32, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginTop: 26, marginBottom: 10 }}>{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 20, marginBottom: 8 }}>{children}</h4>
        ),
        p: ({ children }) => (
          <p style={{ color: 'var(--ash)', lineHeight: 1.7, marginBottom: 14 }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul style={{ listStyle: 'disc', paddingLeft: 24, marginBottom: 14, color: 'var(--ash)' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ listStyle: 'decimal', paddingLeft: 24, marginBottom: 14, color: 'var(--ash)' }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ color: 'var(--ash)', lineHeight: 1.7, marginBottom: 4 }}>{children}</li>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 600, color: 'var(--ink)' }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: 'italic', color: 'var(--ink)' }}>{children}</em>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--indigo)', textDecoration: 'underline', textUnderlineOffset: 2 }}>{children}</a>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className={`mono ${className || ''}`} style={{ display: 'block', background: 'var(--raise2)', color: 'var(--signal)', fontSize: 12, borderRadius: 10, padding: 16, margin: '16px 0', overflowX: 'auto', border: '1px solid var(--line)', lineHeight: 1.7, whiteSpace: 'pre' }} {...props}>{children}</code>
            );
          }
          return (
            <code className="mono" style={{ color: 'var(--indigo)', background: '#818CF814', padding: '2px 6px', borderRadius: 5, fontSize: 12, border: '1px solid #818CF833' }} {...props}>{children}</code>
          );
        },
        pre: ({ children }) => (
          <pre style={{ background: 'var(--raise2)', borderRadius: 10, margin: '16px 0', overflowX: 'auto', border: '1px solid var(--line)' }}>{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: '2px solid var(--signal)', paddingLeft: 16, margin: '16px 0', color: 'var(--ash)', fontStyle: 'italic' }}>{children}</blockquote>
        ),
        hr: () => (
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '32px 0' }} />
        ),
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '16px 0', borderRadius: 10, border: '1px solid var(--line)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead style={{ background: '#0b1016' }}>{children}</thead>
        ),
        th: ({ children }) => (
          <th className="mono" style={{ textAlign: 'left', color: 'var(--ash)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', padding: 12, borderBottom: '1px solid var(--line)' }}>{children}</th>
        ),
        td: ({ children }) => (
          <td style={{ padding: 12, borderBottom: '1px solid var(--line)', color: 'var(--ash)' }}>{children}</td>
        ),
        tr: ({ children }) => (
          <tr>{children}</tr>
        ),
        img: ({ src, alt }) => (
          <img src={src} alt={alt} style={{ borderRadius: 10, border: '1px solid var(--line)', margin: '16px 0', maxWidth: '100%' }} />
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
      <div className="mono" style={{ color: 'var(--ash)', padding: '40px 0' }}>
        Loading policies…
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
        <BookOpen size={36} style={{ margin: '0 auto 12px', color: 'var(--faint)' }} />
        <p style={{ color: 'var(--ink)', fontSize: 14 }}>Unable to load policies</p>
        <p className="mono" style={{ color: 'var(--faint)', fontSize: 12, marginTop: 6 }}>{error}</p>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
        <BookOpen size={36} style={{ margin: '0 auto 12px', color: 'var(--faint)' }} />
        <p style={{ color: 'var(--ink)', fontSize: 14 }}>No policy documents available</p>
        <p className="mono" style={{ color: 'var(--faint)', fontSize: 12, marginTop: 6 }}>Policies will appear here after the next pipeline run</p>
      </div>
    );
  }

  const activePolicy = filteredPolicies[selectedIndex] || filteredPolicies[0];

  return (
    <div className="stack">
      {/* Header */}
      <div>
        <div className="kick">§ — GOVERNANCE</div>
        <h1 className="big">Governing <span className="g">standards</span></h1>
        <p className="lede">
          The FedRAMP 20x rule families and policies governing this authorization, published openly.
        </p>
      </div>

      {/* Content Area */}
      <div className="g2" style={{ gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', alignItems: 'start' }}>
        {/* Policy list */}
        <div className="stack">
          <div className="search">
            <Search size={15} />
            <input
              type="text"
              placeholder="search policies…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
            />
          </div>
          <div className="panel">
            <div className="ph">
              <h4>Policy register</h4>
              <span className="map">{filteredPolicies.length} document{filteredPolicies.length === 1 ? '' : 's'}</span>
            </div>
            {filteredPolicies.map((policy, idx) => (
              <PolicyCard
                key={policy.path}
                policy={policy}
                isSelected={idx === selectedIndex}
                onClick={() => setSelectedIndex(idx)}
              />
            ))}
            {filteredPolicies.length === 0 && (
              <div className="mono" style={{ color: 'var(--faint)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                No policies match your search
              </div>
            )}
          </div>
        </div>

        {/* Policy viewer */}
        <div className="panel">
          {filteredPolicies.length > 0 && (
            <div className="ph">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <BookOpen size={15} style={{ color: 'var(--signal)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activePolicy?.title}
                </span>
              </h4>
              <a
                className="map"
                href={getFileUrl(activePolicy?.path)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--signal)', whiteSpace: 'nowrap' }}
              >
                <ExternalLink size={11} />
                RAW
              </a>
            </div>
          )}
          <div style={{ padding: 22, minHeight: 400 }}>
            {contentLoading ? (
              <div className="mono" style={{ color: 'var(--ash)', padding: '40px 0' }}>
                Loading document…
              </div>
            ) : (
              <MarkdownRenderer content={policyContent} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
