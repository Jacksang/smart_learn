/**
 * Cloud-Agnostic Storage Provider Interface
 *
 * All providers must implement:
 *   upload(key, buffer, mimeType) → { key, url, provider }
 *   getSignedUrl(key, expiresIn)  → url (string)
 *   delete(key)                   → void
 *   exists(key)                   → boolean
 *
 * Configure via STORAGE_PROVIDER env var:
 *   local  → LocalProvider  (./uploads/ — dev/testing)
 *   s3     → S3Provider     (AWS S3)
 *   azure  → AzureProvider  (future — see plan/D13_STORAGE_PROVIDER_GUIDE.md)
 *   aliyun → AliyunProvider (future)
 *
 * Providers are lazy-loaded — only the active provider's SDK is required.
 */

const path = require('path');

const PROVIDER_MAP = {
  local: './providers/local',
  s3: './providers/s3',
  // azure: './providers/azure',  // uncomment after creating the file
  // aliyun: './providers/aliyun', // uncomment after creating the file
};

/**
 * Create a storage provider instance based on env config.
 * Falls back to 'local' if STORAGE_PROVIDER is not set or unknown.
 */
function createProvider(name) {
  const providerName = (name || process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  const modulePath = PROVIDER_MAP[providerName];

  if (!modulePath) {
    console.warn(`Unknown storage provider "${providerName}", falling back to "local"`);
    const LocalProvider = require('./providers/local');
    return new LocalProvider();
  }

  const Provider = require(modulePath);
  return new Provider();
}

module.exports = { createProvider };
