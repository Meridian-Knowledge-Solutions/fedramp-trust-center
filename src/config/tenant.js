// === TENANT CONFIGURATION ===
// Every environment-specific value the trust center needs, in one place,
// overridable at build time via Vite env vars (see .env.example). The defaults
// are the Meridian production values, so a build with no .env behaves exactly
// as before. A retargeted deployment generates .env.production from its
// environment.yaml manifest (portable-core/deploy/render.py in the pipeline repo).
//
// NOTE: each value must use the FULL `import.meta.env.VITE_*` expression —
// Vite's build-time replacement is textual and does not see aliased access
// (e.g. `const env = import.meta.env; env.VITE_X` is NOT replaced).

export const TENANT = {
  // Organization identity
  ORG_NAME: import.meta.env.VITE_ORG_NAME || 'Meridian Knowledge Solutions',

  // Backend API Gateway (CloudFormation output for this tenant's stack)
  API_URL: import.meta.env.VITE_API_URL || 'https://7d7pdwb9t3.execute-api.us-east-1.amazonaws.com/prod',

  // GitHub raw-data source (this repo, where the pipeline syncs public data)
  REPO_OWNER: import.meta.env.VITE_REPO_OWNER || 'Meridian-Knowledge-Solutions',
  REPO_NAME: import.meta.env.VITE_REPO_NAME || 'fedramp-trust-center',
  BRANCH: import.meta.env.VITE_BRANCH || 'master',

  // Contact addresses (fallbacks when cso_public_info.json lacks them)
  SECURITY_EMAIL: import.meta.env.VITE_SECURITY_EMAIL || 'security@meridianks.com',
  FEDRAMP_EMAIL: import.meta.env.VITE_FEDRAMP_EMAIL || 'fedramp_20x@meridianks.com',
  PRIVACY_EMAIL: import.meta.env.VITE_PRIVACY_EMAIL || 'fedramp-security@meridianks.com',

  // External documentation link ("API Docs" button)
  API_DOCS_URL: import.meta.env.VITE_API_DOCS_URL
    || 'https://meridian-knowledge-solutions.github.io/fedramp-20x-public/documentation/api/',

  // Quarterly review registration (Teams event; rotates per quarter)
  QUARTERLY_REGISTRATION_URL: import.meta.env.VITE_QUARTERLY_REGISTRATION_URL
    || 'https://events.teams.microsoft.com/event/7f521f38-4991-4772-8c5d-4d96f215c60c@bc633bf7-1766-4960-bc95-a16fdb861a57',
};

export default TENANT;
