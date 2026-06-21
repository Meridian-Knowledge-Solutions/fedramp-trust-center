import React, { useState, useEffect, memo, useCallback } from 'react';
import { Code2, Download, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useTrustCenterData } from '../../hooks/useTrustCenterData';

// JSON syntax highlighter — emits console `.k` (indigo keys) / `.v` (teal values) spans
const highlightJson = (json, indent = 2) => {
  if (!json) return '';
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, indent);

  return str.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // key
          match = match.replace(/:$/, '');
          return `<span class="k">${escapeHtml(match)}</span>:`;
        }
        // string value
        return `<span class="v">${escapeHtml(match)}</span>`;
      }
      // number / boolean / null value
      return `<span class="v">${escapeHtml(match)}</span>`;
    }
  );
};

const escapeHtml = (str) => {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const propCount = (schemaData) =>
  Object.keys(
    schemaData?.properties || schemaData?.items?.properties ||
    (schemaData?.patternProperties && Object.values(schemaData.patternProperties)[0]?.properties) ||
    schemaData?.$defs || schemaData?.definitions || {}
  ).length;

const reqCount = (schemaData) =>
  (
    schemaData?.required || schemaData?.items?.required ||
    (schemaData?.patternProperties && Object.values(schemaData.patternProperties)[0]?.required) ||
    []
  ).length;

// schema card — `.kpi` tile with a mono filename + a `.tag.ok` VALID
const SchemaCard = memo(({ schema, isSelected, onClick, schemaData }) => {
  const filename = schema.filename || schema.path.split('/').pop();

  return (
    <button
      onClick={onClick}
      className="kpi"
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        background: isSelected ? '#818CF80D' : 'var(--raise)',
        borderColor: isSelected ? '#818CF855' : 'var(--line)',
        transition: '.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span className="mono" style={{ color: 'var(--indigo)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {filename}
        </span>
        <span className="tag ok">VALID</span>
      </div>
      <div className="l" style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <span>{propCount(schemaData)} props</span>
        <span style={{ color: 'var(--faint)' }}>·</span>
        <span>{reqCount(schemaData)} required</span>
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
      <div
        className="ctrl"
        style={{ cursor: hasChildren ? 'pointer' : 'default', paddingLeft: 20 + depth * 20 }}
        onClick={hasChildren ? () => setExpanded((e) => !e) : undefined}
      >
        <div className="nm" style={{ minWidth: 0 }}>
          {hasChildren ? (
            expanded ? <ChevronDown size={13} style={{ color: 'var(--faint)', flexShrink: 0 }} />
              : <ChevronRight size={13} style={{ color: 'var(--faint)', flexShrink: 0 }} />
          ) : (
            <span style={{ width: 13, flexShrink: 0 }} />
          )}
          <span className="mono" style={{ color: 'var(--indigo)', fontSize: 12.5 }}>{name}</span>
          {required && <span style={{ color: 'var(--red)', fontSize: 11 }}>*</span>}
          <span className="mono" style={{ color: 'var(--ash)', fontSize: 11 }}>{prop.type || 'object'}</span>
        </div>
        <span
          className="mono"
          style={{ color: 'var(--faint)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}
        >
          {prop.description || '—'}
        </span>
      </div>
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
      <div className="mono" style={{ color: 'var(--ash)', padding: '40px 0' }}>
        Loading schemas…
      </div>
    );
  }

  if (error || schemas.length === 0) {
    return (
      <div className="panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <Code2 size={32} style={{ color: 'var(--faint)', margin: '0 auto 14px' }} />
        <p style={{ color: 'var(--ash)', fontSize: 14 }}>{error || 'No schema files available'}</p>
        <p className="mono" style={{ color: 'var(--faint)', fontSize: 11, marginTop: 6 }}>
          Schemas will appear after the next pipeline run
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      {/* header */}
      <div>
        <div className="kick">{'{}'} — MACHINE-READABLE</div>
        <h1 className="big">Schemas &amp; <span className="g">contracts</span></h1>
        <p className="lede">
          JSON Schemas for every published artifact, so agency tooling can validate and ingest automatically.
          <span className="mono" style={{ color: 'var(--signal)', marginLeft: 10 }}>
            {schemas.length} schema{schemas.length !== 1 ? 's' : ''} · validation ready
          </span>
        </p>
      </div>

      {/* schema cards */}
      <div className="g2">
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

      {/* schema viewer panel */}
      <div className="panel">
        {/* panel header */}
        <div className="ph">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Code2 size={14} style={{ color: 'var(--indigo)' }} />
            {currentSchema?.path.split('/').pop()}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="seg">
              {['tree', 'raw'].map((mode) => (
                <button
                  key={mode}
                  className={viewMode === mode ? 'on' : ''}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="mono"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--signal)' : 'var(--ash)', display: 'inline-flex', alignItems: 'center' }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <button
              onClick={handleDownload}
              title="Download schema"
              className="mono"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash)', display: 'inline-flex', alignItems: 'center' }}
            >
              <Download size={15} />
            </button>
          </div>
        </div>

        {/* content */}
        <div style={{ maxHeight: 600, overflow: 'auto' }}>
          {!currentData ? (
            <div className="mono" style={{ color: 'var(--ash)', padding: '40px 18px' }}>
              Loading schema…
            </div>
          ) : viewMode === 'tree' ? (
            (() => {
              // Resolve properties from various schema structures:
              // - standard: { properties: {...} }
              // - array type: { type: "array", items: { properties: {...} } }
              // - patternProperties: { patternProperties: { "^pattern$": { properties: {...} } } }
              // - $defs / definitions
              let topProps = currentData.properties
                || currentData.items?.properties
                || null;

              // For patternProperties schemas, extract the first pattern's properties
              if (!topProps && currentData.patternProperties) {
                const firstPattern = Object.values(currentData.patternProperties)[0];
                topProps = firstPattern?.properties || null;
              }

              topProps = topProps || currentData.$defs || currentData.definitions || null;

              const topRequired = currentData.required
                || currentData.items?.required
                || (currentData.patternProperties && Object.values(currentData.patternProperties)[0]?.required)
                || [];

              if (!topProps || Object.keys(topProps).length === 0) {
                return (
                  <div className="mono" style={{ color: 'var(--ash)', padding: '40px 18px', textAlign: 'center' }}>
                    <Code2 size={22} style={{ color: 'var(--faint)', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 12 }}>No properties to display in tree view</p>
                    <p style={{ fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>Switch to RAW to inspect the full schema</p>
                  </div>
                );
              }

              return (
                <div>
                  {Object.entries(topProps).map(([name, prop]) => (
                    <SchemaPropertyRow
                      key={name}
                      name={name}
                      prop={prop}
                      required={Array.isArray(topRequired) && topRequired.includes(name)}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            <div
              className="code"
              dangerouslySetInnerHTML={{ __html: highlightJson(currentData) }}
            />
          )}
        </div>
      </div>
    </div>
  );
});
