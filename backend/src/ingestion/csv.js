const Papa = require('papaparse');
const fs = require('fs');

/**
 * Parse CSV file and extract text with metadata
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<{text: string, metadata: object}>} - Parsed text and metadata
 */
async function parse(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const result = await new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results),
      error: (error) => reject(error)
    });
  });
  
  // Convert rows to text format
  const text = result.data.map(row => 
    Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n')
  ).join('\n\n');
  
  const metadata = {
    rows: result.data.length,
    columns: Object.keys(result.meta.fields || {}).length,
    fileName: filePath,
    fileType: 'csv'
  };
  
  return { text, metadata };
}

module.exports = { parse };
