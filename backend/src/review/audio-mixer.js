/**
 * Audio Mixer for Background Music
 * Combines narration audio with background music
 */

/**
 * Audio Mixer Class
 * Handles volume normalization, ducking, and mixing
 */
class AudioMixer {
  constructor() {
    this.defaultMusicVolume = 0.3; // 30%
    this.defaultDuckingRatio = 0.3; // Music drops to 30% during speech
    this.volumeThreshold = 0.1; // Speech detection threshold
  }

  /**
   * Mix narration audio with background music
   */
  async mixNarration(narrationAudio, backgroundMusic, options = {}) {
    try {
      // Normalize volumes
      const normalizedSpeech = this._normalizeVolume(narrationAudio, 1.0);
      const normalizedMusic = this._normalizeVolume(backgroundMusic, options.musicVolume || this.defaultMusicVolume);

      // Apply ducking if enabled
      const duckedMusic = options.duckingEnabled !== false
        ? this._applyDucking(normalizedMusic, normalizedSpeech, options.duckingRatio || this.defaultDuckingRatio)
        : normalizedMusic;

      // Mix audio tracks
      const mixedAudio = this._mixTracks(normalizedSpeech, duckedMusic);

      // Apply post-processing
      const finalAudio = await this._postProcess(mixedAudio, options);

      return {
        success: true,
        audioData: finalAudio,
        duration: this._calculateDuration(normalizedSpeech, normalizedMusic),
        format: options.format || 'mp3'
      };
    } catch (error) {
      console.error('Error mixing audio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Normalize audio volume to target level
   */
  _normalizeVolume(audioData, targetVolume) {
    const normalized = [...audioData];

    for (let i = 0; i < normalized.length; i++) {
      normalized[i] = Math.max(-1, Math.min(1, normalized[i] * targetVolume));
    }

    return {
      data: normalized,
      peak: this._calculatePeak(normalized)
    };
  }

  /**
   * Calculate audio peak level
   */
  _calculatePeak(audioData) {
    let peak = 0;
    for (const sample of audioData) {
      const absSample = Math.abs(sample);
      if (absSample > peak) {
        peak = absSample;
      }
    }
    return peak;
  }

  /**
   * Apply ducking (lower music during speech)
   */
  _applyDucking(musicData, speechData, duckRatio) {
    const ducked = [...musicData];

    for (let i = 0; i < ducked.length; i++) {
      const speechLevel = Math.abs(speechData.data[i]);

      if (speechLevel > this.volumeThreshold) {
        // Lower music during speech
        ducked[i] = musicData[i] * duckRatio;
      }
      // Otherwise keep normal volume
    }

    return {
      data: ducked,
      peak: this._calculatePeak(ducked)
    };
  }

  /**
   * Mix two audio tracks
   */
  _mixTracks(speech, music) {
    const mixed = [];
    const maxSamples = Math.max(speech.data.length, music.data.length);

    for (let i = 0; i < maxSamples; i++) {
      const speechSample = speech.data[i] || 0;
      const musicSample = music.data[i] || 0;

      // Simple mix: sum both samples
      const mixedSample = speechSample + musicSample;

      // Prevent clipping
      mixed.push(Math.max(-1, Math.min(1, mixedSample)));
    }

    return {
      data: mixed,
      peak: this._calculatePeak(mixed)
    };
  }

  /**
   * Apply post-processing
   */
  async _postProcess(audioData, options) {
    let processed = audioData;

    // Apply fade-in
    if (options.fadeIn > 0) {
      processed = this._applyFade(processed, 0, options.fadeIn);
    }

    // Apply fade-out
    if (options.fadeOut > 0) {
      processed = this._applyFade(processed, options.fadeOut, 0);
    }

    return processed;
  }

  /**
   * Apply fade-in or fade-out
   */
  _applyFade(audioData, fadeInDuration, fadeOutDuration) {
    const totalSamples = audioData.data.length;
    const processed = [...audioData.data];

    // Fade-in
    const fadeInSamples = Math.floor(fadeInDuration * 44100);
    for (let i = 0; i < fadeInSamples && i < totalSamples; i++) {
      const factor = i / fadeInSamples;
      processed[i] *= factor;
    }

    // Fade-out
    const fadeOutSamples = Math.floor(fadeOutDuration * 44100);
    const fadeStart = Math.max(0, totalSamples - fadeOutSamples);
    for (let i = 0; i < fadeOutSamples && (fadeStart + i) < totalSamples; i++) {
      const index = fadeStart + i;
      const factor = 1 - (i / fadeOutSamples);
      processed[index] *= factor;
    }

    return {
      data: processed,
      peak: audioData.peak
    };
  }

  /**
   * Calculate total duration from audio data
   */
  _calculateDuration(speech, music) {
    // Return the longer of the two
    return Math.max(
      this._samplesToSeconds(speech.data.length),
      this._samplesToSeconds(music.data.length)
    );
  }

  /**
   * Convert samples to seconds (44.1kHz sample rate)
   */
  _samplesToSeconds(samples) {
    return samples / 44100;
  }

  /**
   * Generate sample background music (silence placeholder)
   */
  generateSilentMusic(durationSeconds) {
    const samples = Math.floor(durationSeconds * 44100);
    return {
      data: new Array(samples).fill(0),
      peak: 0
    };
  }

  /**
   * Generate pink noise (soft background)
   */
  generatePinkNoise(durationSeconds, volume) {
    const samples = Math.floor(durationSeconds * 44100);
    const noise = [];
    let lastOut = 0;

    for (let i = 0; i < samples; i++) {
      const white = Math.random() * 2 - 1;
      noise[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = noise[i];
      noise[i] *= 3.5 * (volume || 1);
    }

    return {
      data: noise,
      peak: 1.0
    };
  }

  /**
   * Get music library for different styles
   */
  getAvailableMusicStyles() {
    return [
      { id: 'calm', name: 'Calm', description: 'Soft piano and ambient' },
      { id: 'upbeat', name: 'Upbeat', description: 'Light and energetic' },
      { id: 'classical', name: 'Classical', description: 'Bach, Mozart, Beethoven' },
      { id: 'jazz', name: 'Jazz', description: 'Smooth jazz and lounge' },
      { id: 'nature', name: 'Nature', description: 'Birds, rain, ocean waves' },
      { id: 'silence', name: 'Silence', description: 'No background music' }
    ];
  }
}

module.exports = {
  AudioMixer
};
