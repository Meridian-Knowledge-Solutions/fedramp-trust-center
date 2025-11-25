// === AWS API GATEWAY CONFIGURATION ===
export const API_CONFIG = {
    // The core API Gateway endpoint from CloudFormation
    BASE_URL: 'https://7d7pdwb9t3.execute-api.us-east-1.amazonaws.com/prod',

    // API endpoints mapped from legacy SPA
    ENDPOINTS: {
        // System Availability & Uptime
        STATUS: '/status',

        // Secure Configuration (Markdown)
        CONFIG_PUBLIC: '/config',
        CONFIG_TENANT: '/config/tenant', // Requires Auth

        // Authorization Package
        // Returns JSON { url: "https://s3..." } signed URL
        PACKAGE_DOWNLOAD: '/package',

        // Registration & Auth
        REGISTER: '/register',
        VERIFY: '/verify',

        // Full Dataset (KSIs + Metadata)
        DATA: '/api/data'
    },

    // Configuration constants from index.html
    TIMEOUT: 30000, // 30 seconds
    PACKAGE_TIMEOUT: 120000, // 2 minutes
    STATUS_REFRESH_INTERVAL: 300000, // 5 minutes

    // Local Storage Keys
    TOKEN_KEY: 'fedRAMPAccessToken',

    // Feature Flags
    DEMO_MODE: false
};

// === GITHUB RAW DATA CONFIGURATION ===
// Used for fetching static assets directly from the repo
const REPO_OWNER = 'Meridian-Knowledge-Solutions';
const REPO_NAME = 'fedramp-trust-center'; // UPDATED: Points to the new repo
const BRANCH = 'master';

export const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

export const GITHUB_ENDPOINTS = {
  ksiHistory: `${GITHUB_BASE_URL}/public/ksi_history.jsonl`,
  validations: `${GITHUB_BASE_URL}/public/unified_ksi_validations.json`,
  cliRegister: `${GITHUB_BASE_URL}/public/cli_command_register.json`
};
