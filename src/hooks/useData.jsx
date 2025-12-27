import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sanitizer } from '../utils/sanitizer';

const DataContext = createContext();

// --- CONFIGURATION ---
// We calculate this once outside the component to ensure consistency
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}data`
  : `${import.meta.env.BASE_URL}/data`;

export const DataProvider = ({ children }) => {
  const [ksis, setKsis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [history, setHistory] = useState([]);
  const [masData, setMasData] = useState(null);
  const [metrics, setMetrics] = useState({
    score: 0, passed: 0, failed: 0, warning: 0, info: 0
  });

  // Helper: Strip emojis for cleaner text
  const stripEmojis = (str) => {
    if (!str) return '';
    return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // Helper: Parse CLI command strings
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

  // --- STREAM PARSER FOR MIXED JSON FORMATS ---
  const parseJsonStream = (text) => {
    const results = [];
    let buffer = '';
    let depth = 0;
    let inString = false;
    let escaped = false;

    const cleanText = text.replace(/<[^>]*>/g, '').trim();

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      buffer += char;

      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') { inString = !inString; continue; }

      if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            try {
              const obj = JSON.parse(buffer.trim());
              results.push(obj);
            } catch (e) { /* Silently skip malformed chunks */ }
            buffer = '';
          }
        }
      }
    }
    return results;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const cacheBuster = Date.now();

        // --- DATA SOURCES ---
        // PUBLIC (from /public/data/): validations, history, mas_boundary, cli_command_register
        // NOTE: cli_command_register.json is synced from private repo via GitHub Actions pipeline
        // This ensures command details stay in private repo but are accessible in public app

        // --- DEBUGGING LOGS START ---
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 DATA LOAD INITIATED');
        console.log(`📂 Base Path Resolved: "${BASE_PATH}"`);
        // --- DEBUGGING LOGS END ---

        // Prepare URLs
        const urls = {
          validations: `${BASE_PATH}/unified_ksi_validations.json?t=${cacheBuster}`,
          register: `${BASE_PATH}/cli_command_register.json?t=${cacheBuster}`, // Synced from private repo via pipeline
          history: `${BASE_PATH}/ksi_history.jsonl?t=${cacheBuster}`,
          mas: `${BASE_PATH}/mas_boundary.json?t=${cacheBuster}`
        };

        // 1. Fetch All Data Sources
        const [valRes, regRes, histRes, masRes] = await Promise.all([
          fetch(urls.validations),
          fetch(urls.register),
          fetch(urls.history),
          fetch(urls.mas)
        ]);

        // --- MAS DATA PROCESSING (WITH DEBUGGING) ---
        if (masRes.ok) {
          try {
            const masJson = await masRes.json();
            setMasData(masJson);
            console.log("✅ MAS Boundary Data Loaded Successfully");
          } catch (e) {
            console.warn("⚠️ Failed to parse MAS Boundary JSON (Syntax Error):", e);
          }
        } else {
          // THIS IS THE NEW DEBUG BLOCK
          console.error(`❌ MAS Boundary Fetch Failed!`);
          console.error(`   Status: ${masRes.status} (${masRes.statusText})`);
          console.error(`   Attempted URL: ${urls.mas}`);
          if (masRes.status === 404) {
            console.error(`   TIP: Ensure "mas_boundary.json" is in the "/public/data/" directory.`);
          }
        }

        // --- HISTORY PROCESSING ---
        if (histRes.ok) {
          const text = await histRes.text();
          if (!text.trim().startsWith('<')) {
            const historyData = parseJsonStream(text);
            if (historyData.length > 0) {
              const uniqueHistory = Array.from(new Map(historyData.map(item => [item.timestamp, item])).values());
              const sorted = uniqueHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              setHistory(sorted);
            } else {
              setHistory([]);
            }
          }
        } else {
          setHistory([]);
        }

        // --- PROCESS VALIDATIONS ---
        if (!valRes.ok) {
          console.error(`❌ Validation Data Failed: ${valRes.status} at ${urls.validations}`);
          throw new Error(`Failed to load validations (${valRes.status})`);
        }

        const validationText = await valRes.text();
        if (validationText.trim().startsWith('<')) throw new Error("Validation data returned HTML (404)");

        const validationData = JSON.parse(validationText);
        const rawMeta = validationData.metadata || {};

        let rawValidations = validationData.results || validationData.validations || [];
        if (!Array.isArray(rawValidations) && typeof rawValidations === 'object') {
          rawValidations = Object.values(rawValidations);
        }

        // --- REGISTER DATA (SYNCED FROM PRIVATE REPO VIA PIPELINE) ---
        let registerData = {};
        try {
          if (regRes.ok) {
            const regText = await regRes.text();
            if (!regText.trim().startsWith('<')) {
              registerData = JSON.parse(regText);
              console.log("✅ CLI Command Register Loaded");
              console.log(`   Commands Available: ${Object.keys(registerData).length}`);
            } else {
              console.warn("⚠️ CLI Command Register returned HTML (likely 404)");
            }
          } else {
            console.error(`❌ CLI Command Register Fetch Failed!`);
            console.error(`   Status: ${regRes.status} (${regRes.statusText})`);
            console.error(`   URL: ${urls.register}`);
            console.error(`   TIP: Ensure the pipeline has synced cli_command_register.json to /public/data/`);
          }
        } catch (e) {
          console.warn('⚠️ CLI register parse error:', e.message);
        }

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

        // --- CALCULATE METRICS ---
        const totalCount = processed.length;
        const passedCount = processed.filter(k => k.assertion === true || k.assertion === "true").length;
        const failedCount = totalCount - passedCount;
        const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 1000) / 10 : 0;

        const realDate = rawMeta.timestamp || rawMeta.date || rawMeta.generated_at || rawMeta.validation_date || new Date().toISOString();

        setMetadata({
          validation_date: realDate,
          impact_level: rawMeta.impact_level || 'MODERATE',
          pass_rate: rawMeta.pass_rate || `${Math.round(score)}%`,
          passed: passedCount,
          total_validated: totalCount,
          failed: failedCount,
          impact_thresholds: rawMeta.impact_thresholds || { min: '80%' }
        });

        setMetrics({
          score: score,
          passed: passedCount,
          failed: failedCount,
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
    <DataContext.Provider value={{ ksis, metrics, metadata, history, masData, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};