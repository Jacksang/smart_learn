/**
 * Storage Module — Convenience re-exports
 *
 * Usage:
 *   const storage = require('./storage');
 *   await storage.upload('materials/123/doc.pdf', buffer, 'application/pdf');
 *   const url = await storage.getSignedUrl('materials/123/doc.pdf');
 */

const { createProvider } = require('./provider');

// Singleton — one provider instance for the whole app
const storage = createProvider();

module.exports = storage;
module.exports.createProvider = createProvider;
