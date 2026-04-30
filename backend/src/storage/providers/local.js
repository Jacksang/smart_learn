/**
 * Local Filesystem Storage Provider
 *
 * STORAGE_PROVIDER=local
 * Stores files under backend/uploads/ using the given key as relative path.
 * This is the default provider (no cloud dependency needed).
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../../../uploads');

class LocalProvider {
  constructor() {
    if (!fs.existsSync(BASE_DIR)) {
      fs.mkdirSync(BASE_DIR, { recursive: true });
    }
  }

  /**
   * Upload a file to local storage.
   * @param {string} key  - relative path (e.g. "materials/user-1/doc.pdf")
   * @param {Buffer} buffer
   * @param {string} mimeType
   * @returns {{ key: string, url: string, provider: 'local' }}
   */
  async upload(key, buffer, mimeType) {
    const filePath = path.join(BASE_DIR, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, buffer);

    return {
      key,
      url: `/uploads/${key}`,
      provider: 'local',
    };
  }

  /**
   * Return a direct URL for the local file.
   * In local mode, this is just the static path (served by Express).
   */
  async getSignedUrl(key) {
    return `/uploads/${key}`;
  }

  /**
   * Delete a file from local storage.
   */
  async delete(key) {
    const filePath = path.join(BASE_DIR, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  /**
   * Check whether a file exists.
   */
  async exists(key) {
    const filePath = path.join(BASE_DIR, key);
    return fs.existsSync(filePath);
  }

  /**
   * Resolve local path for extraction/processing.
   */
  resolvePath(key) {
    return path.join(BASE_DIR, key);
  }
}

module.exports = LocalProvider;
