import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sanitizer } from '../utils/sanitizer';

const DataContext = createContext();

// PRODUCTION CONFIG: Raw GitHub Content URLs
// Updated to point to NEW fedramp-trust-center repository (files at root)
const REPO_BASE = 'https://raw.githubusercontent.com/Meridian-Knowledge-Solutions/fedramp-trust-center/master';

export const DataProvider = ({ children }) => {
  const [ksis, setKsis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({
    score: 0, passed: 0, failed: 0, warning: 0, info: 0
  });

  const stripEmojis = (str) => {
    if (!str) return '';
    return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  };

  const parseCliCommandString = (cliString, assertion) => {
    if (!cliString) return [];
    const match = cliString.match(/^(\d+)\s+commands?\s+\((\d+)\s+successful\):\s*(.+)$/);

    if (!match) {
      return [{
        command: cliString,
        description: 'Primary validation command',
        status: assertion ? 'success' : 'failed',
        exit_code: assertion ? 0 : 1,
        execution_time: 'N/A',
        source: 'fallback_single'
      }];
    }

    const [, totalStr, successfulStr, commandsStr] = match;
    const successfulCount = parseInt(successfulStr, 10);

    return commandsStr.split(';').map((cmd, index) => ({
      command: cmd.trim(),
      description: `Command #${index + 1}`,
      status: index < successfulCount ? 'success' : 'failed',
      exit_code: index < successfulCount ? 0 : 1,
      execution_time: 'N/A',
      source: 'fallback_parsed'
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`🔄 Fetching live data from: ${REPO_BASE}`);

        // 1. Fetch Live Data from GitHub Raw
        const [valRes, regRes, histRes] = await Promise.all([
          fetch(`${REPO_BASE}/unified_ksi_validations.json`),
          fetch(`${REPO_BASE}/cli_command_register.json`),
          fetch(`${REPO_BASE}/ksi_history.jsonl`)
        ]);

        // --- PROCESS HISTORY ---
        if (histRes.ok) {
          const text = await histRes.text();
          let historyData = [];
          try {
            // Strategy: Smart Wrap for JSONL/PrettyJSON mixed content
            const formatted = '[' + text.trim().replace(/}\s*{/g, '},{') + ']';
            historyData = JSON.parse(formatted);
          } catch (e1) {
            // Strategy: Line-by-line fallback
            historyData = text.split('\n')
              .map(l => l.trim()).filter(l => l.startsWith('{'))
              .map(l => { try { return JSON.parse(l) } catch (e) { return null } })
              .filter(x => x);
          }
          if (Array.isArray(historyData)) {
            const sorted = historyData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setHistory(sorted);
          }
        } else {
          // Fail-safe history
          setHistory([
            { timestamp: new Date(Date.now() - 86400000).toISOString(), compliance_rate: 0 },
            { timestamp: new Date().toISOString(), compliance_rate: 0 }
          ]);
        }

        // --- PROCESS VALIDATIONS ---
        if (!valRes.ok) throw new Error('Failed to load validations from GitHub');

        const validationData = await valRes.json();
        let registerData = {};
        try { if (regRes.ok) registerData = await regRes.json(); } catch (e) { }

        if (validationData.metadata) setMetadata(validationData.metadata);

        let rawValidations = [];
        if (validationData.validations) rawValidations = validationData.validations;
        else if (Array.isArray(validationData)) rawValidations = validationData;
        else if (validationData.results) rawValidations = Object.values(validationData.results);

        const processed = rawValidations.map(val => {
          const id = val.ksi_id || val.validation_id || val.id;
          const registerEntry = registerData[id] || {};
          const status = Sanitizer.determineStatus(val);
          const successCount = parseInt(val.successful_commands || 0, 10);

          let commands = [];
          let source = 'unknown';

          if (registerEntry.cli_commands && registerEntry.cli_commands.length > 0) {
            commands = registerEntry.cli_commands.map((cmd, idx) => {
              const isSuccess = idx < successCount;
              return {
                ...cmd,
                description: cmd.note || cmd.description || `Command #${idx + 1}`,
                status: isSuccess ? 'success' : 'failed',
                exit_code: isSuccess ? 0 : 1,
                source: 'register'
              };
            });
            source = 'comprehensive_register';
          } else if (val.cli_command) {
            commands = parseCliCommandString(val.cli_command, val.assertion);
            source = commands.length > 0 ? 'validation_summary' : 'unknown';
          }

          return {
            ...val,
            id: id,
            status: status,
            assertion: val.assertion,
            category: stripEmojis(val.long_name || val.category || 'General'),
            description: stripEmojis(val.requirement || val.description),
            assertion_reason: stripEmojis(val.assertion_reason),
            detailed_commands: commands,
            command_source: source,
            register_description: stripEmojis(registerEntry.description),
            register_justification: stripEmojis(registerEntry.justification),
            commands_executed: val.commands_executed || commands.length || 0,
            successful_commands: successCount
          };
        });

        setKsis(processed);

        // Metrics
        const total = processed.length;
        const passed = processed.filter(k => k.assertion === true || k.assertion === "true").length;
        const failed = total - passed;

        setMetrics({
          score: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
          passed: passed,
          failed: failed,
          warning: processed.filter(k => k.status === 'warning').length,
          info: processed.filter(k => k.status === 'info').length
        });

      } catch (error) {
        console.error("Data Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ ksis, metrics, metadata, history, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};