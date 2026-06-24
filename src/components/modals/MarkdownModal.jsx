import React, { useEffect, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal } from './BaseModal';
import { FileText, Download, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

export const MarkdownModal = () => {
  const { modals, closeModal } = useModal();
  const { isOpen, data } = modals.markdown;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && data?.markdown) {
      setIsLoading(true);
      // Small delay for smooth transition
      setTimeout(() => setIsLoading(false), 100);
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
          {/* Markdown content — console-styled, constrained reading measure */}
          <div className="markdown-content max-w-none mb-6 text-[14px] leading-[1.7] text-[#C2CCD6]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                // Headings
                h1: ({ node, ...props }) => <h1 className="text-[22px] font-semibold text-[#E8EEF4] tracking-tight mb-5 mt-8 pb-3 border-b border-[#1A222D]" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-[17px] font-semibold text-[#E8EEF4] mb-3 mt-7 pl-3 border-l-2 border-[#34E0C4]" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-[15px] font-semibold text-[#E8EEF4] mb-2 mt-5" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#788596] mb-2 mt-4 font-mono" {...props} />,

                // Paragraphs
                p: ({ node, ...props }) => <p className="mb-4 leading-[1.7] text-[#C2CCD6]" {...props} />,

                // Lists
                ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-[#C2CCD6] marker:text-[#34E0C4]" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-[#C2CCD6] marker:text-[#818CF8] marker:font-mono" {...props} />,
                li: ({ node, ...props }) => <li className="leading-[1.6] pl-1" {...props} />,

                // Links
                a: ({ node, ...props }) => <a className="text-[#818CF8] hover:text-[#9aa3fa] underline decoration-[#818CF8]/30 underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,

                // Code
                code: ({ node, inline, ...props }) =>
                  inline
                    ? <code className="bg-[#0A0E13] text-[#34E0C4] px-1.5 py-0.5 rounded border border-[#1A222D] text-[12.5px] font-mono" {...props} />
                    : <code className="block text-[#9FE9DC] text-[12.5px] font-mono leading-[1.7]" {...props} />,
                pre: ({ node, ...props }) => <pre className="bg-[#07090C] p-4 rounded-xl mb-4 overflow-x-auto border border-[#1A222D]" {...props} />,

                // Tables
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-5 rounded-xl border border-[#1A222D]">
                    <table className="min-w-full border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-[#0b1016]" {...props} />,
                tbody: ({ node, ...props }) => <tbody {...props} />,
                tr: ({ node, ...props }) => <tr className="border-b border-[#1A222D] last:border-0 hover:bg-[#34E0C4]/[0.03] transition-colors" {...props} />,
                th: ({ node, ...props }) => <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#788596] font-mono" {...props} />,
                td: ({ node, ...props }) => <td className="px-4 py-2.5 text-[13px] text-[#C2CCD6] align-top" {...props} />,

                // Blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-2 border-[#818CF8] bg-[#818CF8]/[0.06] pl-4 pr-3 py-2 my-4 rounded-r-lg text-[#B6C0CC] italic" {...props} />
                ),

                // Horizontal Rule
                hr: ({ node, ...props }) => <hr className="border-[#1A222D] my-6" {...props} />,

                // Strong / Emphasis
                strong: ({ node, ...props }) => <strong className="font-semibold text-[#E8EEF4]" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-[#C2CCD6]" {...props} />,
              }}
            >
              {data?.markdown || ''}
            </ReactMarkdown>
          </div>

          {/* Footer */}
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