import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Sanitizer } from '../utils/sanitizer';

const DataContext = createContext();

// --- CONFIGURATION ---
// We calculate this once outside the component to ensure consistency
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}data`
  : `${import.meta.env.BASE_URL}/data`;

const showNotification = (title, body, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

export const DataProvider = ({ children }) => {
  const [ksis, setKsis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [history, setHistory] = useState([]);
  const [masData, setMasData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [metrics, setMetrics] = useState({
    score: 0, passed: 0, failed: 0, warning: 0, info: 0
  });

  const previousScore = useRef(null);
  const refreshInterval = useRef(null);

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

  const loadData = useCallback(async () => {
    try {
      const cacheBuster = Date.now();

      // --- DATA SOURCES ---
      // PUBLIC (from /public/data/): validations, history, mas_boundary, cli_command_register, summary
      // NOTE: cli_command_register.json is synced from private repo via GitHub Actions pipeline
      // This ensures command details stay in private repo but are accessible in public app

      // --- DEBUGGING LOGS START ---
      console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 DATA LOAD INITIATED');
      console.log(`📂 Base Path Resolved: "${BASE_PATH}"`);
      // --- DEBUGGING LOGS END ---

      // Prepare URLs
      const urls = {
        validations: `${BASE_PATH}/unified_ksi_validations.json?t=${cacheBuster}`,
        register: `${BASE_PATH}/cli_command_register.json?t=${cacheBuster}`, // Synced from private repo via pipeline
        history: `${BASE_PATH}/ksi_history.jsonl?t=${cacheBuster}`,
        mas: `${BASE_PATH}/mas_boundary.json?t=${cacheBuster}`,
        metricsHistory: `${BASE_PATH}/metrics_history.jsonl?t=${cacheBuster}`
      };

      // 1. Fetch All Data Sources
      const [valRes, regRes, histRes, masRes, metricsRes] = await Promise.all([
        fetch(urls.validations),
        fetch(urls.register),
        fetch(urls.history),
        fetch(urls.mas),
        fetch(urls.metricsHistory)
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

      // --- METRICS DATA PROCESSING ---
      if (metricsRes.ok) {
        try {
          const metricsText = await metricsRes.text();
          if (!metricsText.trim().startsWith('<')) {
            const rawLines = metricsText.split('\n')
              .map(line => line.trim())
              .filter(line => line.startsWith('{'))
              .map(line => {
                try { return JSON.parse(line); } catch { return null; }
              })
              .filter(Boolean);

            const deduplicated = Object.values(
              rawLines.reduce((acc, curr) => {
                acc[curr.week] = curr;
                return acc;
              }, {})
            );

            setMetricsData({ weeks: deduplicated });
            console.log("✅ Metrics History Loaded Successfully");
            console.log(`   Weeks Available: ${deduplicated.length}`);
          } else {
            console.warn("⚠️ Metrics History returned HTML (likely 404)");
          }
        } catch (e) {
          console.warn("⚠️ Failed to parse Metrics History:", e);
        }
      } else {
        console.error(`❌ Metrics History Fetch Failed!`);
        console.error(`   Status: ${metricsRes.status} (${metricsRes.statusText})`);
        console.error(`   Attempted URL: ${urls.metricsHistory}`);
        if (metricsRes.status === 404) {
          console.error(`   TIP: Ensure "metrics_history.jsonl" is in the "/public/data/" directory.`);
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

        let actualSuccessCount;
        let commands = [];
        let source = 'unknown';

        // PRIORITY 1: Use actual command execution data if available (NEW!)
        if (val.command_executions && Array.isArray(val.command_executions) && val.command_executions.length > 0) {
          commands = val.command_executions.map((exec) => ({
            command: exec.command,
            description: exec.description || `Command #${exec.index + 1}`,
            status: exec.status,  // Actual execution status from engine
            exit_code: exec.exit_code,
            execution_time: exec.execution_time,
            error_message: exec.error_message,
            output: exec.error_message || 'Command executed successfully',
            source: 'execution_log'
          }));
          actualSuccessCount = val.successful_commands || 0;
          source = 'execution_log';
        }
        // PRIORITY 2: Use command register if no execution data
        else if (registerEntry.cli_commands && registerEntry.cli_commands.length > 0) {
          const totalCommands = registerEntry.cli_commands.length;
          const isPassing = val.assertion === true || val.assertion === "true";

          if (isPassing) {
            // All commands must have succeeded for KSI to pass
            actualSuccessCount = totalCommands;
          } else {
            // For failing KSIs, estimate based on score
            const score = parseInt(val.score || 0, 10);
            actualSuccessCount = Math.round((score / 100) * totalCommands);
          }

          commands = registerEntry.cli_commands.map((cmd, idx) => {
            const isSuccess = idx < actualSuccessCount;
            return {
              ...cmd,
              description: cmd.note || cmd.description || `Command #${idx + 1}`,
              status: isSuccess ? 'success' : 'failed',
              exit_code: isSuccess ? 0 : 1,
              source: 'register'
            };
          });
          source = 'comprehensive_register';
        }
        // PRIORITY 3: Fallback to parsing cli_command string
        else if (val.cli_command) {
          commands = parseCliCommandString(val.cli_command, val.assertion);
          source = commands.length > 0 ? 'validation_summary' : 'unknown';
          const isPassing = val.assertion === true || val.assertion === "true";
          actualSuccessCount = isPassing
            ? commands.length
            : Math.round(((val.score || 0) / 100) * commands.length);
        } else {
          actualSuccessCount = 0;
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
          commands_executed: commands.length || 0,  // Actual command count
          successful_commands: actualSuccessCount
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

      // Check for notifications
      const settings = JSON.parse(localStorage.getItem('trustCenterSettings') || '{"notifications": false}');
      if (settings.notifications) {
        if (previousScore.current !== null && previousScore.current !== score) {
          const change = score - previousScore.current;
          const emoji = change > 0 ? '📈' : '📉';

          showNotification(
            'Compliance Score Updated',
            `${emoji} Score changed from ${previousScore.current}% to ${score}% (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`,
            { tag: 'compliance-update' }
          );
        }

        previousScore.current = score;
      }

    } catch (error) {
      console.error("Data Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh logic
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('trustCenterSettings') || '{"autoRefresh": true}');

    if (settings.autoRefresh) {
      refreshInterval.current = setInterval(() => {
        console.log('🔄 Auto-refreshing data...');
        loadData();
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [loadData]);

  return (
    <DataContext.Provider value={{ ksis, metrics, metadata, history, masData, metricsData, loading, reload: loadData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};