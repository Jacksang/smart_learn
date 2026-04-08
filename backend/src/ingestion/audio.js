const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Parse audio files using Whisper CLI
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<{text: string, timestamps: object[], metadata: object}>} - Parsed text and metadata
 */
async function parse(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const supportedFormats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];
  
  if (!supportedFormats.includes(extension)) {
    throw new Error(`Unsupported audio format: ${extension}. Supported formats: ${supportedFormats.join(', ')}`);
  }
  
  // Check if whisper CLI is available
  const whisperAvailable = await checkWhisperCLI();
  if (!whisperAvailable) {
    throw new Error('Whisper CLI not found. Please install it to use audio transcription.');
  }
  
  // Create temporary directory for processing
  const tempDir = path.join(process.cwd(), 'tmp', 'audio-processing');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const outputDir = path.join(tempDir, Date.now().toString());
  fs.mkdirSync(outputDir, { recursive: true });
  
  const outputFilePath = path.join(outputDir, 'transcript.txt');
  
  try {
    // Run whisper CLI to extract text and timestamps
    const result = await transcribeAudio(filePath, outputFilePath);
    
    // Read the transcript text
    const text = fs.readFileSync(outputFilePath, 'utf8');
    
    // Extract timestamps if available (Whisper outputs with timestamps option)
    const timestamps = extractTimestamps(text);
    
    return {
      text: text.trim(),
      timestamps,
      metadata: {
        duration: result.duration || 'unknown',
        fileSize: fs.statSync(filePath).size,
        fileName: path.basename(filePath),
        fileType: extension,
        processedAt: new Date().toISOString()
      }
    };
  } finally {
    // Clean up temporary files
    cleanupDirectory(outputDir);
  }
}

/**
 * Check if Whisper CLI is available
 */
async function checkWhisperCLI() {
  return new Promise((resolve) => {
    execFile('whisper', ['--help'], (error) => {
      resolve(error === null);
    });
  });
}

/**
 * Transcribe audio file using Whisper CLI
 */
async function transcribeAudio(inputPath, outputFilePath) {
  return new Promise((resolve, reject) => {
    const args = [
      inputPath,
      '--output-format', 'txt',
      '--output-dir', path.dirname(outputFilePath),
      '--model', 'base', // Use base model for faster processing
      '--word-timestamps'  // Enable word-level timestamps
    ];
    
    execFile('whisper', args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Whisper CLI error: ${stderr}`));
        return;
      }
      
      // Extract duration from audio file using ffprobe if available
      const duration = extractDuration(inputPath);
      
      resolve({ duration });
    });
  });
}

/**
 * Extract audio duration using ffprobe
 */
function extractDuration(filePath) {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=yes "${filePath}"`, { encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Extract timestamps from transcript text
 */
function extractTimestamps(text) {
  const timestamps = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Look for timestamp patterns in the text
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})(.*)/);
    if (timestampMatch) {
      timestamps.push({
        start: timestampMatch[1],
        end: timestampMatch[2],
        text: timestampMatch[3].trim()
      });
    } else if (line.trim()) {
      // Add text lines without timestamps
      timestamps.push({
        start: null,
        end: null,
        text: line.trim()
      });
    }
  }
  
  return timestamps;
}

/**
 * Clean up temporary directory
 */
function cleanupDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

module.exports = { parse };
