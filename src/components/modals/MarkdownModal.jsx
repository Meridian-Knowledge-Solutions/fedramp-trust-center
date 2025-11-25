import React, { useEffect, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { BaseModal } from './BaseModal';
import { FileText, Download, Loader } from 'lucide-react';

export const MarkdownModal = () => {
  const { modals, closeModal } = useModal();
  const { isOpen, data } = modals.markdown;
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && data?.markdown) {
      setIsLoading(true);
      
      // Simple markdown to HTML conversion (for demo - use a library like marked.js in production)
      const convertMarkdownToHtml = (markdown) => {
        return markdown
          .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-900 mt-8 mb-4">$1</h1>')
          .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold">$1</strong>')
          .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
          .replace(/\n\n/gim, '</p><p class="text-sm text-slate-700 mb-4">')
          .replace(/^\- (.*$)/gim, '<li class="text-sm text-slate-700 ml-4">• $1</li>')
          .replace(/\n/gim, '<br/>');
      };

      const html = `<div class="markdown-content">${convertMarkdownToHtml(data.markdown)}</div>`;
      setHtmlContent(html);
      setIsLoading(false);
    }
  }, [isOpen, data]);

  const handleDownload = () => {
    if (!data?.markdown) return;

    const blob = new Blob([data.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename || 'configuration.md';
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
          <span>{data?.title || 'Secure Configuration'}</span>
        </div>
      }
      size="xlarge"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-indigo-600" size={32} />
          <span className="ml-3 text-slate-600">Loading configuration...</span>
        </div>
      ) : (
        <>
          {/* Content */}
          <div 
            className="prose prose-sm max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Download Button */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
            <p className="text-xs text-slate-500">
              {data?.subtitle || 'FedRAMP 20x Secure Configuration Standard'}
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
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