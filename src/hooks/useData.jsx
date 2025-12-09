import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sanitizer } from '../utils/sanitizer';

const DataContext = createContext();

// --- CONFIGURATION ---
// Points to the local /data/ folder where the pipeline injects files
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}data`
  : `${import.meta.env.BASE_URL}/data`;

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
        // Cache buster to force fresh data from the latest deployment
        const cacheBuster = Date.now();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 DATA LOAD INITIATED (Pipeline Injected)');
        console.log(`📍 Base Path: ${BASE_PATH}`);

        // 1. Fetch Data from Local Injection Path
        const [valRes, regRes, histRes] = await Promise.all([
          fetch(`${BASE_PATH}/unified_ksi_validations.json?t=${cacheBuster}`),
          fetch(`${BASE_PATH}/cli_command_register.json?t=${cacheBuster}`),
          fetch(`${BASE_PATH}/ksi_history.jsonl?t=${cacheBuster}`)
        ]);

        // --- BULLETPROOF HISTORY PARSING (FIXED) ---
        if (histRes.ok) {
          const text = await histRes.text();
          let historyData = [];

          if (!text.trim().startsWith('<')) {
            // Strict Line-by-Line Parsing
            const lines = text.split(/\r?\n/); // Handle both \n and \r\n

            historyData = lines
              .map(line => line.trim())
              .filter(line => line.length > 0 && line.startsWith('{')) // Ignore empty lines or non-JSON garbage
              .map(line => {
                try {
                  return JSON.parse(line);
                } catch (e) {
                  // Silently fail on bad lines (prevents crash)
                  return null;
                }
              })
              .filter(item => item !== null); // Remove failed parses
          }

          if (historyData.length > 0) {
            // Sort oldest to newest for charts
            const sorted = historyData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setHistory(sorted);
          } else {
            // Fallback if file is empty
            setHistory([]);
          }
        } else {
          // Default empty state if 404
          setHistory([]);
        }

        // --- PROCESS VALIDATIONS ---
        if (!valRes.ok) throw new Error(`Failed to load validations (${valRes.status})`);

        const validationText = await valRes.text();
        if (validationText.trim().startsWith('<')) throw new Error("Validation data returned HTML (404)");

        const validationData = JSON.parse(validationText);
        const rawMeta = validationData.metadata || {};

        // Handle different array keys (results vs validations)
        let rawValidations = validationData.results || validationData.validations || [];
        if (!Array.isArray(rawValidations) && typeof rawValidations === 'object') {
          rawValidations = Object.values(rawValidations);
        }

        // --- REGISTER DATA ---
        let registerData = {};
        try {
          if (regRes.ok) {
            const regText = await regRes.text();
            if (!regText.trim().startsWith('<')) {
              registerData = JSON.parse(regText);
            }
          }
        } catch (e) { console.warn('CLI register unavailable'); }

        // --- PROCESS ITEMS ---
        const processed = rawValidations.map(val => {
          const id = val.ksi_id || val.validation_id || val.id;
          const registerEntry = registerData[id] || registerData[id.replace(/-/g, '_')] || {};
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

        // --- CALCULATE METRICS (Source of Truth) ---
        const totalCount = processed.length;
        const passedCount = processed.filter(k => k.assertion === true || k.assertion === "true").length;
        const failedCount = totalCount - passedCount;
        const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 1000) / 10 : 0;

        // --- DATE DETECTIVE ---
        const realDate = rawMeta.timestamp || rawMeta.date || rawMeta.generated_at || rawMeta.validation_date || null;

        // Update Metadata State
        setMetadata({
          validation_date: realDate,
          impact_level: rawMeta.impact_level || 'MODERATE',
          pass_rate: rawMeta.pass_rate || `${Math.round(score)}%`,
          passed: passedCount,
          total_validated: totalCount,
          failed: failedCount,
          impact_thresholds: rawMeta.impact_thresholds || { min: '80%' }
        });

        // Update Metrics State
        setMetrics({
          score: score,
          passed: passedCount,
          failed: failedCount,
          warning: processed.filter(k => k.status === 'warning').length,
          info: processed.filter(k => k.status === 'info').length
        });

        console.log('📋 DATA LOADED:');
        console.log(`  📅 Date: ${realDate}`);
        console.log(`  📊 Score: ${score}% (${passedCount}/${totalCount})`);

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