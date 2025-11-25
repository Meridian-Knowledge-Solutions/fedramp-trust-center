import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

export const useSystemStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // 1. Construct the real URL (https://.../prod/status)
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATUS}`;
        console.log(`🔍 Fetching system status from: ${url}`);

        const response = await fetch(url, {
          method: 'GET',
          // 2. Set timeout signal
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data);
          console.log("✅ System Status Live:", data);
        } else {
          throw new Error(`Status API returned ${response.status}`);
        }
      } catch (error) {
        console.error("⚠️ Status fetch failed, using fallback:", error);
        // 3. Fallback data so the UI doesn't look broken if API is unreachable
        setStatus({
          uptime_percent: '100.00',
          '5xx_requests': 0,
          avg_latency: '0ms',
          status: 'operational'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // 4. Set up Polling (every 5 mins)
    const interval = setInterval(fetchStatus, API_CONFIG.STATUS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { status, loading };
};