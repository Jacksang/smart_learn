const fs = require('fs');
const pdfParse = require('pdf-parse');

function toTopicsFromText(text) {
  return text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 30)
    .map(line => ({
      title: line.slice(0, 120),
      description: '',
      learningObjectives: [],
      difficulty: 'medium',
    }));
}

async function parseOutlineFile(filePath, mimetype) {
  if (mimetype === 'application/pdf') {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    return {
      rawText: result.text || '',
      topics: toTopicsFromText(result.text || ''),
    };
  }

  if (mimetype === 'text/plain') {
    const text = fs.readFileSync(filePath, 'utf8');
    return {
      rawText: text,
      topics: toTopicsFromText(text),
    };
  }

  return {
    rawText: '',
    topics: [],
  };
}

module.exports = { parseOutlineFile };
