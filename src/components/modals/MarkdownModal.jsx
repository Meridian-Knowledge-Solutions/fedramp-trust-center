import React, { useEffect, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal } from './BaseModal';
import { FileText, Download, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

// ---------------------------------------------------------------------------
// Helpers for the custom, responsive table renderer.
// Wide markdown tables are the worst offender in a modal — the right-hand
// columns get clipped behind a horizontal scrollbar nobody notices. Instead we
// read the table's hast node and, for wide tables, render each row as a card so
// every field is visible and reflows to the available width.
// ---------------------------------------------------------------------------
const els = (n) => (n?.children || []).filter((c) => c.type === 'element');
const nodeText = (n) => {
  if (!n) return '';
  if (n.type === 'text') return n.value;
  return (n.children || []).map(nodeText).join('');
};

// Re-render the inline content of a cell (text, code, bold, italic, links…).
const renderInline = (n, key = 0) => {
  if (!n) return null;
  if (n.type === 'text') return n.value;
  if (n.type !== 'element') return null;
  const kids = (n.children || []).map((c, i) => renderInline(c, i));
  const p = n.properties || {};
  switch (n.tagName) {
    case 'code':
      return <code key={key} className="bg-[#0A0E13] text-[#34E0C4] px-1.5 py-0.5 rounded border border-[#1A222D] text-[12px] font-mono break-words">{kids}</code>;
    case 'strong':
      return <strong key={key} className="font-semibold text-[#E8EEF4]">{kids}</strong>;
    case 'em':
      return <em key={key} className="italic">{kids}</em>;
    case 'del':
      return <del key={key} className="line-through text-[#788596]">{kids}</del>;
    case 'a':
      return <a key={key} href={p.href} target="_blank" rel="noopener noreferrer" className="text-[#818CF8] hover:text-[#9aa3fa] underline decoration-[#818CF8]/30 underline-offset-2">{kids}</a>;
    case 'br':
      return <br key={key} />;
    default:
      return <span key={key}>{kids}</span>;
  }
};

const STATUS_HEADERS = ['status', 'state', 'result', 'verdict', 'compliance', 'enforced'];
const statusTone = (text) => {
  const t = text.toLowerCase();
  if (/(enforced|enabled|pass|operational|compliant|active|healthy|\bok\b|\byes\b|\btrue\b)/.test(t)) return 'ok';
  if (/(review|warn|partial|pending|conditional|degraded|planned)/.test(t)) return 'warn';
  if (/(fail|disabled|missing|non-?compliant|\bno\b|\bfalse\b|error|critical)/.test(t)) return 'red';
  return 'vi';
};
const toneClass = {
  ok: 'text-[#34E0C4] bg-[#34E0C4]/10',
  warn: 'text-[#F2B85C] bg-[#F2B85C]/10',
  red: 'text-[#F2607A] bg-[#F2607A]/10',
  vi: 'text-[#818CF8] bg-[#818CF8]/10',
};

const ResponsiveTable = ({ node }) => {
  const kids = els(node);
  const thead = kids.find((c) => c.tagName === 'thead');
  const tbody = kids.find((c) => c.tagName === 'tbody');
  const headers = (thead ? els(els(thead)[0] || {}) : []).map((c) => nodeText(c).trim());
  const rows = tbody ? els(tbody).map((tr) => els(tr)) : [];

  if (headers.length === 0 || rows.length === 0) return null;

  const statusIdx = headers.findIndex((h) => STATUS_HEADERS.includes(h.toLowerCase()));

  // Wide table → one card per row (no horizontal scroll, nothing hidden).
  if (headers.length >= 4) {
    return (
      <div className="space-y-2.5 mb-5">
        {rows.map((cells, ri) => {
          const stText = statusIdx > 0 && cells[statusIdx] ? nodeText(cells[statusIdx]).trim() : '';
          return (
            <div key={ri} className="rounded-xl border border-[#1A222D] bg-[#0A0E13] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#0b1016] border-b border-[#1A222D]">
                <div className="text-[14px] font-semibold text-[#E8EEF4] min-w-0 break-words">
                  {renderInline(cells[0])}
                </div>
                {stText && (
                  <span className={`shrink-0 font-mono text-[10px] px-2 py-1 rounded ${toneClass[statusTone(stText)]}`}>
                    {stText.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 px-4 py-3.5">
                {headers.map((h, ci) => {
                  if (ci === 0 || ci === statusIdx) return null;
                  return (
                    <div key={ci} className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#788596] mb-1">{h}</div>
                      <div className="text-[13px] text-[#C2CCD6] break-words leading-[1.6]">
                        {cells[ci] ? renderInline(cells[ci]) : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Narrow table → clean console table; cells wrap so nothing clips.
  return (
    <div className="mb-5 rounded-xl border border-[#1A222D] overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-[#0b1016]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left text-[10.5px] font-mono uppercase tracking-[0.06em] text-[#788596] font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri} className="border-t border-[#1A222D] hover:bg-[#34E0C4]/[0.03] transition-colors">
              {cells.map((c, ci) => (
                <td key={ci} className="px-4 py-2.5 text-[13px] text-[#C2CCD6] align-top break-words">{renderInline(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MarkdownModal = () => {
  const { modals, closeModal } = useModal();
  const { isOpen, data } = modals.markdown;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && data?.markdown) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen, data]);

  const handleDownload = () => {
    if (!data?.markdown) return;
    const blob = new Blob([data.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => closeModal('markdown')}
      title={
        <div className="flex items-center gap-2.5">
          <FileText size={18} className="text-[#34E0C4]" />
          <span>{data?.title || 'Document'}</span>
        </div>
      }
      size="large"
      variant="dark"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="animate-spin text-[#34E0C4]" size={28} />
          <span className="ml-3 text-[#788596] font-mono text-sm">Loading document…</span>
        </div>
      ) : (
        <>
          <div className="markdown-content max-w-none mb-6 text-[14px] leading-[1.7] text-[#C2CCD6]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-[22px] font-semibold text-[#E8EEF4] tracking-tight mb-5 mt-8 first:mt-0 pb-3 border-b border-[#1A222D]" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-[17px] font-semibold text-[#E8EEF4] mb-3 mt-7 pl-3 border-l-2 border-[#34E0C4]" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-[15px] font-semibold text-[#E8EEF4] mb-2 mt-5" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#788596] mb-2 mt-4 font-mono" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-[1.7] text-[#C2CCD6]" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-[#C2CCD6] marker:text-[#34E0C4]" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-[#C2CCD6] marker:text-[#818CF8] marker:font-mono" {...props} />,
                li: ({ node, ...props }) => <li className="leading-[1.6] pl-1" {...props} />,
                a: ({ node, ...props }) => <a className="text-[#818CF8] hover:text-[#9aa3fa] underline decoration-[#818CF8]/30 underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                code: ({ node, inline, ...props }) =>
                  inline
                    ? <code className="bg-[#0A0E13] text-[#34E0C4] px-1.5 py-0.5 rounded border border-[#1A222D] text-[12.5px] font-mono break-words" {...props} />
                    : <code className="block text-[#9FE9DC] text-[12.5px] font-mono leading-[1.7]" {...props} />,
                pre: ({ node, ...props }) => <pre className="bg-[#07090C] p-4 rounded-xl mb-4 overflow-x-auto border border-[#1A222D]" {...props} />,
                // Responsive table: cards for wide tables, clean table for narrow ones.
                table: ({ node }) => <ResponsiveTable node={node} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-2 border-[#818CF8] bg-[#818CF8]/[0.06] pl-4 pr-3 py-2 my-4 rounded-r-lg text-[#B6C0CC] italic" {...props} />
                ),
                hr: ({ node, ...props }) => <hr className="border-[#1A222D] my-6" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-[#E8EEF4]" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-[#C2CCD6]" {...props} />,
              }}
            >
              {data?.markdown || ''}
            </ReactMarkdown>
          </div>

          <div className="pt-5 border-t border-[#1A222D] flex justify-between items-center gap-4">
            <p className="text-[11px] text-[#424E5C] font-mono">
              {data?.subtitle || 'FedRAMP 20x · machine-readable evidence'}
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#818CF8] hover:bg-[#9aa3fa] text-[#07090C] rounded-lg transition-all font-mono text-[12px] font-semibold tracking-wide hover:shadow-[0_0_24px_-4px_#818CF8] whitespace-nowrap"
            >
              <Download size={15} />
              Download Markdown
            </button>
          </div>
        </>
      )}
    </BaseModal>
  );
};
