/**
 * TTS Engine Interface
 * Supports multiple TTS providers (ElevenLabs, local, system)
 */

/**
 * TTS Engine Class
 * Abstract interface for different TTS providers
 */
class TTSEngine {
  constructor() {
    this.config = null;
    this.isInitialized = false;
    this.voices = new Map();
    this.activeGenerations = new Map();
  }

  /**
   * Initialize engine with configuration
   */
  async initialize(config) {
    this.config = config;
    this.isInitialized = true;
    await this._loadVoices();
    return true;
  }

  /**
   * Load available voices
   */
  async _loadVoices() {
    // Override in subclasses
    this.voices.clear();
    
    // Default voices
    this.voices.set('default', {
      id: 'default',
      name: 'Default Voice',
      language: 'en',
      gender: 'neutral'
    });
    
    this.voices.set('alex', {
      id: 'alex',
      name: 'Alex',
      language: 'en',
      gender: 'male'
    });
    
    this.voices.set('emma', {
      id: 'emma',
      name: 'Emma',
      language: 'en',
      gender: 'female'
    });
  }

  /**
   * Get available voices
   */
  async getVoices() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return Array.from(this.voices.values());
  }

  /**
   * Generate speech from text
   */
  async generate(text, voiceId, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized');
    }

    if (!this.voices.has(voiceId)) {
      throw new Error(`Voice not found: ${voiceId}`);
    }

    // Preprocess text
    const processedText = this._preprocessText(text);

    // Generate unique job ID
    const jobId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.activeGenerations.set(jobId, { status: 'starting', progress: 0 });

    try {
      // Generate audio
      const audioData = await this._generateSpeech(processedText, voiceId, options);

      // Update status
      this.activeGenerations.delete(jobId);

      return {
        jobId,
        audioData,
        format: options.format || 'mp3',
        voiceId,
        duration: this._estimateDuration(processedText),
        textLength: text.length
      };
    } catch (error) {
      this.activeGenerations.delete(jobId);
      throw error;
    }
  }

  /**
   * Preprocess text for better TTS output
   */
  _preprocessText(text) {
    let processed = text;

    // Format numbers
    processed = processed.replace(/\b(\d+)\b/g, (match) => {
      if (match.length === 4 && /^\d{4}$/.test(match)) {
        return match; // Keep years as-is
      }
      return match;
    });

    // Format percentages
    processed = processed.replace(/(\d+)%/g, '$1 percent');

    // Format currency
    processed = processed.replace(/\$(\d+)/g, '$1 dollars');

    // Expand abbreviations
    processed = processed.replace(/\betc\b/gi, 'et cetera');
    processed = processed.replace(/\bvs\b/gi, 'versus');
    processed = processed.replace(/\band\b/g, ' and ');
    processed = processed.replace(/\bor\b/g, ' or ');

    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ');

    return processed.trim();
  }

  /**
   * Add pause markers for better prosody
   */
  _addPauseMarkers(text) {
    let marked = text;

    // Section breaks (paragraphs)
    marked = marked.replace(/\n\n/g, ' ... ');

    // Commas (short pause)
    marked = marked.replace(/,/g, ',');

    // Periods (medium pause)
    marked = marked.replace(/\./g, '.');

    // Ellipsis (long pause)
    marked = marked.replace(/\.\.\./g, '...');

    return marked;
  }

  /**
   * Estimate audio duration from text
   */
  _estimateDuration(text) {
    const wordsPerMinute = 150; // Average speaking rate
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = wordCount / wordsPerMinute;
    return Math.ceil(minutes * 60); // Return seconds
  }

  /**
   * Cancel ongoing generation
   */
  async cancel(jobId) {
    if (this.activeGenerations.has(jobId)) {
      await this._cancelGeneration(jobId);
      this.activeGenerations.delete(jobId);
      return true;
    }
    return false;
  }

  /**
   * Check generation status
   */
  async getStatus(jobId) {
    if (this.activeGenerations.has(jobId)) {
      return {
        status: 'generating',
        progress: this.activeGenerations.get(jobId).progress
      };
    }
    return { status: 'unknown' };
  }

  /**
   * Apply post-processing to audio
   */
  async _postProcessAudio(audioData, options) {
    // Normalize volume
    const normalized = this._normalizeVolume(audioData, options.volume || 1.0);

    // Apply fade-in/out
    const faded = this._applyFade(normalized, options.fadeIn || 0.1, options.fadeOut || 0.1);

    return faded;
  }

  /**
   * Normalize audio volume
   */
  _normalizeVolume(audioData, targetVolume) {
    // Apply volume scaling
    return audioData.map(sample => sample * targetVolume);
  }

  /**
   * Apply fade-in and fade-out
   */
  _applyFade(audioData, fadeInDuration, fadeOutDuration) {
    const fadeInSamples = Math.floor(fadeInDuration * 44100);
    const fadeOutSamples = Math.floor(fadeOutDuration * 44100);
    const totalSamples = audioData.length;

    const fadeData = [...audioData];

    // Apply fade-in
    for (let i = 0; i < fadeInSamples; i++) {
      const factor = i / fadeInSamples;
      fadeData[i] *= factor;
    }

    // Apply fade-out
    const fadeStart = Math.max(0, totalSamples - fadeOutSamples);
    for (let i = 0; i < fadeOutSamples; i++) {
      const index = fadeStart + i;
      const factor = 1 - (i / fadeOutSamples);
      fadeData[index] *= factor;
    }

    return fadeData;
  }
}

/**
 * ElevenLabs TTS Engine (Premium)
 */
class ElevenLabsEngine extends TTSEngine {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async _loadVoices() {
    super._loadVoices();

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        data.voices.forEach(voice => {
          this.voices.set(voice.voice_id, {
            id: voice.voice_id,
            name: voice.name,
            language: voice.languages?.[0] || 'en',
            gender: voice.category
          });
        });
      }
    } catch (error) {
      console.error('Failed to load ElevenLabs voices:', error);
    }
  }

  async _generateSpeech(text, voiceId, options) {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: options.model || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity_boost || 0.75,
          style: options.style || 0.0,
          use_speaker_boost: options.useSpeakerBoost !== false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    // Return blob data
    return await response.blob();
  }
}

/**
 * Local TTS Engine (Free fallback)
 */
class LocalTTSEngine extends TTSEngine {
  constructor() {
    super();
    this.backend = null;
  }

  async initialize(config) {
    await super.initialize(config);
    // Initialize local backend if needed
    return true;
  }

  async _generateSpeech(text, voiceId, options) {
    // Call local TTS backend
    const response = await fetch('http://localhost:5000/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        voice: voiceId,
        format: options.format || 'mp3'
      })
    });

    if (!response.ok) {
      throw new Error('Local TTS backend error');
    }

    return await response.blob();
  }
}

/**
 * System TTS Engine (Universal fallback)
 */
class SystemTTSEngine extends TTSEngine {
  constructor() {
    super();
    this.synth = null;
  }

  async initialize() {
    await super.initialize();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      await this._loadVoices();
    }
  }

  async _loadVoices() {
    super._loadVoices();

    if (this.synth) {
      const voices = this.synth.getVoices();
      voices.forEach(voice => {
        this.voices.set(voice.name, {
          id: voice.name,
          name: voice.name,
          language: voice.lang,
          localService: voice.default
        });
      });
    }
  }

  async _generateSpeech(text, voiceName, options) {
    if (!this.synth) {
      throw new Error('Speech synthesis not available');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = Array.from(this.voices.values()).find(v => v.id === voiceName);

      if (voice && voice.localService) {
        utterance.voice = this.synth.getVoices().find(v => v.name === voiceName);
      }

      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => {
        resolve({
          type: 'blob',
          data: null, // SpeechSynthesis doesn't return audio data
          format: 'system'
        });
      };

      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synth.speak(utterance);
    });
  }
}

/**
 * TTS Engine Factory
 */
class TTSFactory {
  static createEngine(type, config = {}) {
    switch (type) {
      case 'elevenlabs':
        return new ElevenLabsEngine(config.apiKey);
      case 'local':
        return new LocalTTSEngine();
      case 'system':
        return new SystemTTSEngine();
      default:
        return new TTSEngine();
    }
  }
}

module.exports = {
  TTSEngine,
  ElevenLabsEngine,
  LocalTTSEngine,
  SystemTTSEngine,
  TTSFactory
};
