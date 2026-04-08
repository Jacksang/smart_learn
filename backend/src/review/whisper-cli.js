/**
 * Whisper CLI Wrapper
 * Interface for speech-to-text using OpenAI Whisper CLI
 */

/**
 * Whisper Engine Class
 * Wraps the Whisper CLI for speech recognition
 */
class WhisperEngine {
  constructor() {
    this.config = null;
    this.cliPath = 'whisper';
    this.isInitialized = false;
    this.activeJobs = new Map();
    this.models = ['tiny', 'base', 'small', 'medium', 'large'];
  }

  /**
   * Initialize engine with configuration
   */
  async initialize(config = {}) {
    this.config = {
      cliPath: config.cliPath || 'whisper',
      model: config.model || 'small',
      temperature: config.temperature || 0,
      language: config.language || 'en',
      withoutTimestamps: config.withoutTimestamps || false,
      wordTimestamps: config.wordTimestamps || true,
      beamSize: config.beamSize || 5
    };

    try {
      // Verify Whisper CLI is available
      const { exec } = require('child_process');
      await this._exec(`${this.config.cliPath} --version`);
      this.isInitialized = true;
      return true;
    } catch (error) {
      throw new Error('Whisper CLI not found. Please install via: pip install openai-whisper');
    }
  }

  /**
   * Transcribe audio file
   */
  async transcribe(audioPath, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cfg = { ...this.config, ...options };

    const args = [
      audioPath,
      `--model=${cfg.model}`,
      '--output_format=json',
      '--output_dir=/tmp/smartlearn',
      `--language=${cfg.language}`
    ];

    if (cfg.withoutTimestamps) {
      args.push('--without_timestamps');
    }

    if (cfg.wordTimestamps) {
      args.push('--word_timestamps');
    }

    if (cfg.temperature !== undefined) {
      args.push(`--temperature=${cfg.temperature}`);
    }

    if (cfg.beamSize !== undefined) {
      args.push(`--beam_size=${cfg.beamSize}`);
    }

    const jobId = `transcribe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.activeJobs.set(jobId, { status: 'starting', progress: 0 });

    try {
      const startTime = Date.now();
      const output = await this._exec(`whisper ${args.join(' ')}`);

      const processingTime = (Date.now() - startTime) / 1000;

      const result = {
        jobId,
        success: true,
        data: JSON.parse(output),
        processingTime,
        language: cfg.language,
        model: cfg.model
      };

      this.activeJobs.delete(jobId);
      return result;
    } catch (error) {
      this.activeJobs.delete(jobId);
      throw error;
    }
  }

  /**
   * Get available models
   */
  getModels() {
    return [
      { name: 'tiny', size: '75MB', speed: 'fast', accuracy: 'good', recommended: false },
      { name: 'base', size: '142MB', speed: 'fast', accuracy: 'very good', recommended: false },
      { name: 'small', size: '466MB', speed: 'medium', accuracy: 'excellent', recommended: true },
      { name: 'medium', size: '1.5GB', speed: 'slow', accuracy: 'near perfect', recommended: false },
      { name: 'large', size: '3GB', speed: 'slowest', accuracy: 'best', recommended: false }
    ];
  }

  /**
   * Cancel transcription job
   */
  async cancel(jobId) {
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.delete(jobId);
      return true;
    }
    return false;
  }

  /**
   * Get job status
   */
  getStatus(jobId) {
    if (this.activeJobs.has(jobId)) {
      return {
        status: this.activeJobs.get(jobId).status,
        jobId
      };
    }
    return { status: 'unknown' };
  }

  /**
   * Execute shell command
   */
  async _exec(command) {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.trim());
      });
    });
  }

  /**
   * Validate audio file
   */
  async validateAudio(audioPath) {
    const fs = require('fs');
    const supportedFormats = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];
    const ext = audioPath.split('.').pop().toLowerCase();

    if (!fs.existsSync(audioPath)) {
      throw new Error('Audio file not found');
    }

    if (!supportedFormats.includes('.' + ext)) {
      throw new Error(`Unsupported audio format: ${ext}. Supported: ${supportedFormats.join(', ')}`);
    }

    return true;
  }

  /**
   * Transcribe with retry logic
   */
  async transcribeWithRetry(audioPath, options = {}, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.transcribe(audioPath, options);
      } catch (error) {
        lastError = error;
        if (i === maxRetries - 1) {
          throw error;
        }
        // Exponential backoff
        await this._wait(1000 * Math.pow(2, i));
      }
    }
  }

  /**
   * Wait helper
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Whisper CLI Factory
 */
class WhisperFactory {
  static createEngine(config = {}) {
    return new WhisperEngine();
  }
}

module.exports = {
  WhisperEngine,
  WhisperFactory
};
