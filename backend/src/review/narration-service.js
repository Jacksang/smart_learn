/**
 * Narration Service Layer
 * Orchestrates narration generation and playback
 */

const { TTSFactory } = require('./tts-engine');
const { AudioMixer } = require('./audio-mixer');

/**
 * Narration Service Class
 * Manages narration creation, status, and playback
 */
class NarrationService {
  constructor() {
    this.ttsFactory = new TTSFactory();
    this.audioMixer = new AudioMixer();
    this.narrations = new Map(); // In-memory storage for MVP
    this.generations = new Map(); // Track active generations
  }

  /**
   * Initialize service with configuration
   */
  async initialize(config) {
    this.config = config;
    this.ttsEngine = this.ttsFactory.createEngine(config.ttsType || 'system', config.ttsConfig);
    await this.ttsEngine.initialize(config.ttsConfig);
  }

  /**
   * Generate narration from lesson materials
   */
  async generateNarration(projectId, lessonId, materials, options = {}) {
    try {
      // Validate inputs
      if (!lessonId || !materials || !Array.isArray(materials) || materials.length === 0) {
        throw new Error('Invalid lesson materials');
      }

      // Preprocess materials
      const processedText = this._preprocessMaterials(materials);

      // Create narration record
      const narrationId = `narration_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      this.generations.set(narrationId, {
        status: 'generating',
        progress: 0,
        stage: 'text_preprocessing'
      });

      // Generate speech
      const speechResult = await this._generateSpeech(processedText, options);

      // Update progress
      this.generations.set(narrationId, {
        status: 'generating',
        progress: 50,
        stage: 'audio_generation'
      });

      // Add background music
      const music = this._getBackgroundMusic(options.musicStyle);

      // Mix audio
      const mixedAudio = await this.audioMixer.mixNarration(
        speechResult,
        music,
        options.mixing
      );

      // Save narration
      const narration = {
        id: narrationId,
        projectId,
        lessonId,
        title: this._generateTitle(materials),
        status: 'complete',
        voiceId: options.voiceId || 'default',
        voiceName: await this._getVoiceName(options.voiceId),
        musicStyle: options.musicStyle || 'silence',
        musicVolume: options.musicVolume || 0.3,
        duckingEnabled: options.duckingEnabled !== false,
        playbackSpeed: options.playbackSpeed || 1.0,
        durationSeconds: mixedAudio.duration || this._estimateDuration(processedText),
        audioUrl: this._generateAudioUrl(narrationId),
        fileSizeBytes: this._estimateFileSize(processedText),
        outputFormat: options.outputFormat || 'mp3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.narrations.set(narrationId, narration);
      this.generations.delete(narrationId);

      return {
        success: true,
        data: {
          narrationId,
          status: 'complete',
          message: 'Narration generated successfully',
          durationSeconds: narration.durationSeconds,
          estimatedFileSize: narration.fileSizeBytes
        }
      };
    } catch (error) {
      console.error('Error generating narration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Preprocess lesson materials into text
   */
  _preprocessMaterials(materials) {
    return materials.map(material => {
      if (material.type === 'text') {
        return material.content || '';
      } else if (material.type === 'pdf' || material.type === 'docx') {
        // In production, extract text from file
        return material.extractedText || '';
      } else if (material.type === 'url') {
        // In production, scrape content from URL
        return material.content || '';
      }
      return '';
    }).join('\n\n---\n\n');
  }

  /**
   * Generate speech from text
   */
  async _generateSpeech(text, options) {
    const result = await this.ttsEngine.generate(text, options.voiceId || 'default', {
      format: options.outputFormat || 'mp3',
      stability: options.stability || 0.5,
      similarityBoost: options.similarityBoost || 0.75
    });

    return result;
  }

  /**
   * Get background music by style
   */
  _getBackgroundMusic(style) {
    switch (style) {
      case 'calm':
        return this.audioMixer.generatePinkNoise(10, 0.3);
      case 'upbeat':
        return this.audioMixer.generatePinkNoise(10, 0.4);
      case 'classical':
        return this.audioMixer.generatePinkNoise(10, 0.25);
      case 'jazz':
        return this.audioMixer.generatePinkNoise(10, 0.2);
      case 'nature':
        return this.audioMixer.generatePinkNoise(10, 0.35);
      case 'silence':
      default:
        return this.audioMixer.generateSilentMusic(10);
    }
  }

  /**
   * Generate title from materials
   */
  _generateTitle(materials) {
    const firstMaterial = materials[0];
    if (firstMaterial && firstMaterial.title) {
      return firstMaterial.title;
    }
    return `Narration ${new Date().toISOString().split('T')[0]}`;
  }

  /**
   * Get voice name by ID
   */
  async _getVoiceName(voiceId) {
    const voices = await this.ttsEngine.getVoices();
    const voice = voices.find(v => v.id === voiceId);
    return voice?.name || voiceId;
  }

  /**
   * Generate audio URL
   */
  _generateAudioUrl(narrationId) {
    return `/api/narration/${narrationId}/download`;
  }

  /**
   * Estimate file size based on text length
   */
  _estimateFileSize(textLength) {
    // Approximately 1MB per minute of audio
    const duration = this._estimateDuration(textLength);
    const estimatedSize = (duration / 60) * 1024 * 1024; // 1MB per minute
    return Math.ceil(estimatedSize);
  }

  /**
   * Estimate audio duration from text
   */
  _estimateDuration(text) {
    const wordsPerMinute = 150;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute * 60);
  }

  /**
   * Get narration by ID
   */
  getNarration(narrationId) {
    const narration = this.narrations.get(narrationId);

    if (!narration) {
      return {
        success: false,
        error: 'Narration not found'
      };
    }

    return {
      success: true,
      data: narration
    };
  }

  /**
   * List narrations for a project
   */
  listNarrations(projectId) {
    const projectNarrations = Array.from(this.narrations.values()).filter(
      n => n.projectId === projectId
    );

    return {
      success: true,
      data: {
        narrations: projectNarrations.map(n => ({
          id: n.id,
          lessonId: n.lessonId,
          title: n.title,
          duration: this._formatDuration(n.durationSeconds),
          durationSeconds: n.durationSeconds,
          voice: n.voiceName,
          musicStyle: n.musicStyle,
          status: n.status,
          fileSize: this._formatFileSize(n.fileSizeBytes),
          createdAt: n.createdAt
        })),
        total: projectNarrations.length
      }
    };
  }

  /**
   * Delete narration
   */
  deleteNarration(narrationId) {
    const narration = this.narrations.get(narrationId);
    if (!narration) {
      return {
        success: false,
        error: 'Narration not found'
      };
    }

    this.narrations.delete(narrationId);

    return {
      success: true,
      message: 'Narration deleted successfully'
    };
  }

  /**
   * Get narration status (for long-running generations)
   */
  getNarrationStatus(narrationId) {
    const narration = this.narrations.get(narrationId);
    const generation = this.generations.get(narrationId);

    if (narration) {
      return {
        success: true,
        data: {
          narrationId,
          status: narration.status,
          progress: 100,
          message: 'Generation complete'
        }
      };
    }

    if (generation) {
      return {
        success: true,
        data: {
          narrationId,
          status: generation.status,
          progress: generation.progress,
          stage: generation.stage,
          message: `Generation in progress: ${generation.stage}`
        }
      };
    }

    return {
      success: false,
      error: 'Narration not found'
    };
  }

  /**
   * Format duration for display
   */
  _formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format file size for display
   */
  _formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Global instance
const narrationService = new NarrationService();

module.exports = {
  NarrationService,
  narrationService
};
