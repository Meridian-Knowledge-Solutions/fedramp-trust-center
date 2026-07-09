// === AWS API GATEWAY CONFIGURATION ===
// Tenant-specific values come from src/config/tenant.js (env-var driven).
import { TENANT } from './tenant';

export const API_CONFIG = {
    // The core API Gateway endpoint from CloudFormation (per-tenant)
    BASE_URL: TENANT.API_URL,

    // API endpoints mapped from legacy SPA
    ENDPOINTS: {
        // System Availability & Uptime
        STATUS: '/status',

        // Secure Configuration (Markdown)
        CONFIG_PUBLIC: '/config',
        CONFIG_TENANT: '/config/tenant', // Requires Auth

        // Certification Package
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

// === QUARTERLY REVIEW SESSION ===
// Canonical registration URL maintained here so pipeline data syncs cannot overwrite it.
// Update this value whenever a new Teams event is created for the next quarterly session.
export const QUARTERLY_REGISTRATION_URL = TENANT.QUARTERLY_REGISTRATION_URL;

// === GITHUB RAW DATA CONFIGURATION ===
// Used for fetching static assets directly from the repo
const REPO_OWNER = TENANT.REPO_OWNER;
const REPO_NAME = TENANT.REPO_NAME;
const BRANCH = TENANT.BRANCH;

export const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

export const GITHUB_ENDPOINTS = {
  ksiHistory: `${GITHUB_BASE_URL}/public/ksi_history.jsonl`,
  validations: `${GITHUB_BASE_URL}/public/unified_ksi_validations.json`,
  cliRegister: `${GITHUB_BASE_URL}/public/cli_command_register.json`
};
