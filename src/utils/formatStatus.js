/**
 * Format system status data for clean display
 */

export const formatStatus = (status) => {
  if (!status) return null;

  return {
    // Format uptime: "100.0000" → "100%" or "99.99%" → "99.99%"
    uptimePercent: formatUptime(status.uptime_percent),
    
    // Format requests: "91" → "91" or "1234" → "1,234"
    totalRequests: formatNumber(status.total_requests),
    
    // Format latency: "206.12ms" → "206ms"
    avgLatency: formatLatency(status.avg_latency),
    
    // Keep as-is
    errorRequests: status['5xx_requests'] || '0',
    
    // Format timestamps
    timeRange: {
      start: formatTimestamp(status.time_range_start),
      end: formatTimestamp(status.time_range_end),
    },
    
    // Raw values for calculations
    raw: status
  };
};

/**
 * Format uptime percentage
 * "100.0000" → "100%"
 * "99.9876" → "99.99%"
 */
const formatUptime = (uptime) => {
  if (!uptime) return '100';
  
  const num = parseFloat(uptime);
  
  // If 100%, just show "100"
  if (num === 100) return '100';
  
  // Otherwise show up to 2 decimals, trim trailing zeros
  return num.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Format numbers with commas
 * "1234" → "1,234"
 * "91" → "91"
 */
const formatNumber = (num) => {
  if (!num) return '0';
  return parseInt(num).toLocaleString();
};

/**
 * Format latency
 * "206.12ms" → "206ms"
 * "1234.56ms" → "1,235ms"
 */
const formatLatency = (latency) => {
  if (!latency) return 'N/A';
  
  // Extract number from "206.12ms"
  const num = parseFloat(latency);
  
  // Round to whole number
  const rounded = Math.round(num);
  
  // Add commas if needed and append "ms"
  return `${rounded.toLocaleString()}ms`;
};

/**
 * Format timestamp to relative or absolute time
 * "2025-11-26T08:26:52.998Z" → "2 minutes ago" or "8:26 AM"
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.abs(now - date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  // If within last hour, show relative
  if (minutes < 60) {
    if (minutes === 0) return 'just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  }
  
  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // Otherwise show date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};