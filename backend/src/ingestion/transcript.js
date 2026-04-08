const fs = require('fs');

/**
 * Parse subtitle files (.srt, .vtt) and plain text transcripts
 * @param {string} filePath - Path to the transcript file
 * @returns {Promise<{text: string, timestamps: object[], metadata: object}>} - Parsed text and metadata
 */
async function parse(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const extension = filePath.split('.').pop().toLowerCase();
  
  if (extension === 'srt') {
    return parseSRT(filePath);
  } else if (extension === 'vtt') {
    return parseVTT(filePath);
  } else if (extension === 'txt') {
    return parsePlainText(filePath);
  }
  
  throw new Error(`Unsupported transcript format: ${extension}`);
}

/**
 * Parse SRT (SubRip Subtitle) files
 */
async function parseSRT(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Split by subtitle blocks
  const blocks = fileContent.trim().split(/\n\n+/);
  
  const textLines = [];
  const timestamps = [];
  
  for (const block of blocks) {
    const lines = block.split('\n');
    
    if (lines.length < 2) continue; // Skip invalid blocks
    
    // Parse timestamp line
    const timestampMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (timestampMatch) {
      timestamps.push({
        start: timestampMatch[1],
        end: timestampMatch[2]
      });
    }
    
    // Collect text content (skip index and timestamp lines)
    const text = lines.slice(2).join('\n');
    if (text.trim()) {
      textLines.push(text);
    }
  }
  
  return {
    text: textLines.join('\n\n'),
    timestamps,
    metadata: {
      subtitleCount: timestamps.length,
      fileName: filePath,
      fileType: 'srt'
    }
  };
}

/**
 * Parse VTT (WebVTT) files
 */
async function parseVTT(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Split by subtitle blocks (skip WEBVTT header)
  const lines = fileContent.split('\n');
  const blocks = [];
  let currentBlock = '';
  
  for (const line of lines) {
    if (line.startsWith('WEBVTT')) continue; // Skip header
    
    if (line.trim() === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = '';
      }
    } else {
      currentBlock += line + '\n';
    }
  }
  
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  
  const textLines = [];
  const timestamps = [];
  
  for (const block of blocks) {
    const blockLines = block.trim().split('\n');
    
    if (blockLines.length < 2) continue; // Skip invalid blocks
    
    // Parse timestamp line
    const timestampMatch = blockLines[0].match(/(\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}\.\d{3})/);
    if (timestampMatch) {
      timestamps.push({
        start: timestampMatch[1],
        end: timestampMatch[2]
      });
    }
    
    // Collect text content (skip index and timestamp lines)
    const text = blockLines.slice(timestampMatch ? 1 : 0).join('\n');
    if (text.trim()) {
      textLines.push(text);
    }
  }
  
  return {
    text: textLines.join('\n\n'),
    timestamps,
    metadata: {
      subtitleCount: timestamps.length,
      fileName: filePath,
      fileType: 'vtt'
    }
  };
}

/**
 * Parse plain text files
 */
async function parsePlainText(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  return {
    text: fileContent.trim(),
    timestamps: [],
    metadata: {
      textLength: fileContent.length,
      fileName: filePath,
      fileType: 'txt'
    }
  };
}

module.exports = { parse, parseSRT, parseVTT, parsePlainText };
