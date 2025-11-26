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
        <div className="flex items-center gap-2">
          <FileText size={20} />
          <span>{data?.title || 'Document'}</span>
        </div>
      }
      size="xlarge"
      variant="dark"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-400" size={32} />
          <span className="ml-3 text-gray-300">Loading document...</span>
        </div>
      ) : (
        <>
          {/* Markdown Content with Professional Styling */}
          <div className="markdown-content prose prose-invert prose-slate max-w-none mb-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                // Headings
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mb-4 mt-8 pb-2 border-b border-gray-700" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mb-3 mt-6" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-gray-100 mb-2 mt-4" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-lg font-bold text-gray-100 mb-2 mt-3" {...props} />,

                // Paragraphs
                p: ({ node, ...props }) => <p className="text-gray-300 mb-4 leading-relaxed" {...props} />,

                // Lists
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300" {...props} />,
                li: ({ node, ...props }) => <li className="ml-4 text-gray-300" {...props} />,

                // Links
                a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,

                // Code
                code: ({ node, inline, ...props }) =>
                  inline
                    ? <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                    : <code className="block bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700" {...props} />,
                pre: ({ node, ...props }) => <pre className="bg-gray-900 p-4 rounded-lg mb-4 overflow-x-auto border border-gray-700" {...props} />,

                // Tables
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border-collapse border border-gray-700" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-gray-800" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-700" {...props} />,
                tr: ({ node, ...props }) => <tr className="border-b border-gray-700" {...props} />,
                th: ({ node, ...props }) => <th className="px-4 py-2 text-left text-sm font-bold text-gray-100 border border-gray-700" {...props} />,
                td: ({ node, ...props }) => <td className="px-4 py-2 text-sm text-gray-300 border border-gray-700" {...props} />,

                // Blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-gray-800/50 italic text-gray-300" {...props} />
                ),

                // Horizontal Rule
                hr: ({ node, ...props }) => <hr className="border-gray-700 my-6" {...props} />,

                // Strong/Bold
                strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,

                // Emphasis/Italic
                em: ({ node, ...props }) => <em className="italic text-gray-200" {...props} />,
              }}
            >
              {data?.markdown || ''}
            </ReactMarkdown>
          </div>

          {/* Download Button */}
          <div className="pt-6 border-t border-gray-700 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {data?.subtitle || 'FedRAMP 20x Documentation'}
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20"
            >
              <Download size={16} />
              Download Markdown
            </button>
          </div>
        </>
      )}
    </BaseModal>
  );
};