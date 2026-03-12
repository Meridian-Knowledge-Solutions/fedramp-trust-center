import React, { useState, useEffect, memo, useCallback } from 'react';
import { Code2, Download, Copy, Check, ChevronDown, ChevronRight, FileJson } from 'lucide-react';
import { useTrustCenterData } from '../../hooks/useTrustCenterData';

const THEME = {
  panel: 'bg-[#121217]',
  border: 'border-white/10',
};

// Simple JSON syntax highlighter
const highlightJson = (json, indent = 2) => {
  if (!json) return '';
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, indent);

  return str.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-300'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-400'; // key
          match = match.replace(/:$/, '');
          return `<span class="${cls}">${escapeHtml(match)}</span>:`;
        } else {
          cls = 'text-emerald-400'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-rose-400'; // null
      }
      return `<span class="${cls}">${escapeHtml(match)}</span>`;
    }
  );
};

const escapeHtml = (str) => {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const SchemaCard = memo(({ schema, isSelected, onClick, schemaData }) => {
  const typeLabel = schema.title?.replace(' Schema', '') || schema.path.split('/').pop().replace('.json', '');

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group cursor-pointer ${
        isSelected
          ? 'bg-blue-500/10 border-blue-500/30'
          : `${THEME.panel} ${THEME.border} hover:border-white/20`
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg border ${
          isSelected
            ? 'bg-blue-500/15 border-blue-500/30'
            : 'bg-white/5 border-white/5 group-hover:border-white/10'
        }`}>
          <FileJson size={16} className={isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${isSelected ? 'text-blue-400' : 'text-slate-300'}`}>
              {typeLabel}
            </span>
            <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-white/5 text-slate-500 border border-white/5 uppercase tracking-wider">
              JSON Schema
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{schema.description}</div>
          {schemaData && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600 font-mono">
              <span>{Object.keys(schemaData.properties || {}).length} properties</span>
              <span className="text-slate-700">|</span>
              <span>{(schemaData.required || []).length} required</span>
            </div>
          )}
        </div>
        <ChevronRight size={14} className={`mt-1 transition-transform ${isSelected ? 'text-blue-400 rotate-90' : 'text-slate-600'}`} />
      </div>
    </button>
  );
});

const SchemaPropertyRow = memo(({ name, prop, required, depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = prop.properties || prop.items?.properties;
  const childProps = prop.properties || prop.items?.properties || {};

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
        <td className="px-4 py-2.5 font-mono text-xs text-blue-400" style={{ paddingLeft: `${16 + depth * 20}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren && (
              <button onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-white/10 rounded transition-colors">
                {expanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
              </button>
            )}
            {name}
            {required && <span className="text-rose-400 text-[10px]">*</span>}
          </div>
        </td>
        <td className="px-4 py-2.5 text-xs text-purple-400 font-mono">{prop.type || 'object'}</td>
        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">{prop.description || '—'}</td>
      </tr>
      {expanded && Object.entries(childProps).map(([childName, childProp]) => (
        <SchemaPropertyRow
          key={`${name}.${childName}`}
          name={childName}
          prop={childProp}
          required={(prop.required || prop.items?.required || []).includes(childName)}
          depth={depth + 1}
        />
      ))}
    </>
  );
});

export const SchemaTab = memo(() => {
  const { schemas, getFileUrl, loading, error } = useTrustCenterData();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [schemaData, setSchemaData] = useState({});
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'raw'

  // Load all schemas on mount
  useEffect(() => {
    const loadSchemas = async () => {
      const results = {};
      for (const schema of schemas) {
        try {
          const res = await fetch(getFileUrl(schema.path));
          if (res.ok) {
            results[schema.path] = await res.json();
          }
        } catch {
          // Skip failed loads
        }
      }
      setSchemaData(results);
    };

    if (schemas.length > 0) {
      loadSchemas();
    }
  }, [schemas, getFileUrl]);

  const currentSchema = schemas[selectedIndex];
  const currentData = currentSchema ? schemaData[currentSchema.path] : null;

  const handleCopy = useCallback(() => {
    if (currentData) {
      navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentData]);

  const handleDownload = useCallback(() => {
    if (currentData && currentSchema) {
      const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentSchema.path.split('/').pop();
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [currentData, currentSchema]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading schemas...</p>
        </div>
      </div>
    );
  }

  if (error || schemas.length === 0) {
    return (
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-8 text-center`}>
        <Code2 size={40} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm">{error || 'No schema files available'}</p>
        <p className="text-slate-600 text-xs mt-1">Schemas will appear after the next pipeline run</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">JSON Schemas</h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-mono">
              {schemas.length} schema{schemas.length !== 1 ? 's' : ''} — JSON Schema draft/2020-12
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[9px] font-bold border border-purple-500/20 tracking-wider uppercase">
              Validation Ready
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schema List */}
        <div className="lg:col-span-4 space-y-2">
          {schemas.map((schema, idx) => (
            <SchemaCard
              key={schema.path}
              schema={schema}
              isSelected={idx === selectedIndex}
              onClick={() => setSelectedIndex(idx)}
              schemaData={schemaData[schema.path]}
            />
          ))}
        </div>

        {/* Schema Viewer */}
        <div className="lg:col-span-8">
          <div className={`${THEME.panel} rounded-xl border ${THEME.border} overflow-hidden`}>
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-white/5 bg-[#09090b] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code2 size={14} className="text-blue-400" />
                <span className="text-white font-medium text-sm">
                  {currentSchema?.path.split('/').pop()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-[#09090b] rounded-md p-0.5 border border-white/10">
                  {['tree', 'raw'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                        viewMode === mode
                          ? 'bg-white/10 text-white shadow-sm border border-white/5'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-slate-500 hover:text-white"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-slate-500 hover:text-white"
                  title="Download schema"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-white/10">
              {!currentData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : viewMode === 'tree' ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#09090b]">
                      <th className="px-4 py-2.5 text-left text-[9px] text-slate-500 uppercase tracking-wider font-bold">Property</th>
                      <th className="px-4 py-2.5 text-left text-[9px] text-slate-500 uppercase tracking-wider font-bold">Type</th>
                      <th className="px-4 py-2.5 text-left text-[9px] text-slate-500 uppercase tracking-wider font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.properties && Object.entries(currentData.properties).map(([name, prop]) => (
                      <SchemaPropertyRow
                        key={name}
                        name={name}
                        prop={prop}
                        required={(currentData.required || []).includes(name)}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <pre
                  className="p-4 text-xs font-mono leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: highlightJson(currentData) }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
