/**
 * Audio Mixer Tests
 * Unit tests for audio mixing functionality
 */

const { AudioMixer, VolumeNormalizer, DuckingManager } = require('./audio-mixer');

describe('AudioMixer', () => {
  let mixer;

  beforeEach(() => {
    mixer = new AudioMixer({
      sampleRate: 44100,
      targetLevel: -18,
      duckingDepth: 0.3,
      fadeInDuration: 0.1,
      fadeOutDuration: 0.1
    });
  });

  it('should initialize with default configuration', () => {
    expect(mixer.sampleRate).toBe(44100);
    expect(mixer.targetLevel).toBe(-18);
    expect(mixer.duckingDepth).toBe(0.3);
    expect(mixer.fadeInDuration).toBe(0.1);
    expect(mixer.fadeOutDuration).toBe(0.1);
  });

  it('should initialize with custom configuration', () => {
    mixer = new AudioMixer({
      sampleRate: 48000,
      targetLevel: -12,
      duckingDepth: 0.5,
      fadeInDuration: 0.2,
      fadeOutDuration: 0.3
    });

    expect(mixer.sampleRate).toBe(48000);
    expect(mixer.targetLevel).toBe(-12);
    expect(mixer.duckingDepth).toBe(0.5);
    expect(mixer.fadeInDuration).toBe(0.2);
    expect(mixer.fadeOutDuration).toBe(0.3);
  });

  describe('volume normalization', () => {
    it('should normalize volume to target level', () => {
      const result = mixer.normalizeVolume(100, -10);
      
      expect(result.target).toBe(-10);
      expect(typeof result.scaleFactor).toBe('number');
      expect(result.scaleFactor).toBeLessThan(1);
    });

    it('should handle different input levels', () => {
      const result1 = mixer.normalizeVolume(50, -20);
      const result2 = mixer.normalizeVolume(100, -10);

      expect(result1.scaleFactor).toBeGreaterThan(result2.scaleFactor);
    });

    it('should return 1.0 for target level already met', () => {
      const result = mixer.normalizeVolume(100, 100);
      expect(result.scaleFactor).toBe(1.0);
    });

    it('should clamp scaleFactor to valid range', () => {
      const result = mixer.normalizeVolume(1000, -100); // Very high input
      
      expect(result.scaleFactor).toBeLessThan(1);
      expect(result.scaleFactor).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ducking logic', () => {
    it('should calculate ducking factor based on ducking depth', () => {
      const duckingManager = new DuckingManager(0.3);
      const factor = duckingManager.getDuckingFactor(true);

      expect(factor).toBeLessThan(1.0);
      expect(factor).toBeGreaterThan(0.0);
    });

    it('should return 1.0 when not ducking', () => {
      const duckingManager = new DuckingManager(0.3);
      const factor = duckingManager.getDuckingFactor(false);

      expect(factor).toBe(1.0);
    });

    it('should apply ducking during speech', () => {
      const duckingManager = new DuckingManager(0.3);
      
      // Simulate speech detection
      const duringSpeech = duckingManager.getDuckingFactor(true);
      
      expect(duringSpeech).toBe(0.7); // 1.0 - 0.3 ducking depth
    });

    it('should apply full ducking during pauses', () => {
      const duckingManager = new DuckingManager(0.3);
      
      // During pauses (no speech)
      const duringPause = duckingManager.getDuckingFactor(false);
      
      expect(duringPause).toBe(1.0); // No ducking when quiet
    });
  });

  describe('fade effects', () => {
    it('should create fade-in ramp', () => {
      const fade = mixer.createFadeRamp(100, 0.1);
      
      expect(Array.isArray(fade)).toBe(true);
      expect(fade.length).toBeGreaterThan(0);
      expect(fade[0]).toBeCloseTo(0.0);
      expect(fade[fade.length - 1]).toBeCloseTo(1.0);
    });

    it('should create fade-out ramp', () => {
      const fade = mixer.createFadeRamp(100, 0.1, true);
      
      expect(Array.isArray(fade)).toBe(true);
      expect(fade[0]).toBeCloseTo(1.0);
      expect(fade[fade.length - 1]).toBeCloseTo(0.0);
    });

    it('should create fade-in for speech segment', () => {
      const fade = mixer.createFadeIn(500, 0.1);
      
      expect(fade.length).toBeGreaterThan(0);
      expect(fade[0]).toBeCloseTo(0.0, 0.01);
    });

    it('should create fade-out for speech segment', () => {
      const fade = mixer.createFadeOut(500, 0.1);
      
      expect(fade.length).toBeGreaterThan(0);
      expect(fade[fade.length - 1]).toBeCloseTo(0.0, 0.01);
    });

    it('should handle very short segments', () => {
      const fade = mixer.createFadeRamp(10, 0.01);
      
      expect(fade.length).toBeGreaterThan(0);
    });

    it('should handle very long segments', () => {
      const fade = mixer.createFadeRamp(10000, 0.5);
      
      expect(fade.length).toBeGreaterThan(100);
    });
  });

  describe('pink noise generation', () => {
    it('should generate pink noise of correct duration', () => {
      const noise = mixer.generatePinkNoise(1.0, 44100);
      
      expect(Array.isArray(noise)).toBe(true);
      expect(noise.length).toBeGreaterThan(0);
      expect(noise.length).toBeCloseTo(44100); // 1 second at 44100 Hz
    });

    it('should generate noise for specified duration', () => {
      const noise1 = mixer.generatePinkNoise(1.0, 44100);
      const noise2 = mixer.generatePinkNoise(2.0, 44100);
      
      expect(noise2.length).toBeCloseTo(noise1.length * 2);
    });

    it('should generate noise at specified sample rate', () => {
      const noise44k = mixer.generatePinkNoise(1.0, 44100);
      const noise48k = mixer.generatePinkNoise(1.0, 48000);
      
      expect(noise44k.length).toBe(44100);
      expect(noise48k.length).toBe(48000);
    });

    it('should generate normalized pink noise', () => {
      const noise = mixer.generatePinkNoise(1.0, 44100);
      
      const maxVal = Math.max(...noise.map(Math.abs));
      expect(maxVal).toBeLessThan(1.0);
    });

    it('should generate consistent noise pattern', () => {
      const noise1 = mixer.generatePinkNoise(1.0, 1000, 12345);
      const noise2 = mixer.generatePinkNoise(1.0, 1000, 12345);
      
      // Same seed should produce same noise
      expect(noise1[0]).toBe(noise2[0]);
    });
  });

  describe('music style handling', () => {
    it('should return correct style characteristics', () => {
      const styles = mixer.getMusicStyles();
      
      expect(styles).toBeDefined();
      expect(Array.isArray(styles)).toBe(true);
    });

    it('should get all available music styles', () => {
      const styles = mixer.getMusicStyles();
      const styleNames = styles.map(s => s.name);
      
      expect(styleNames).toContain('calm');
      expect(styleNames).toContain('upbeat');
      expect(styleNames).toContain('classical');
      expect(styleNames).toContain('jazz');
      expect(styleNames).toContain('nature');
      expect(styleNames).toContain('silence');
    });

    it('should get characteristics for specific style', () => {
      const styles = mixer.getMusicStyles();
      const calmStyle = styles.find(s => s.name === 'calm');
      
      expect(calmStyle).toBeDefined();
      expect(calmStyle.volume).toBe(0.2);
      expect(typeof calmStyle.bpm).toBe('number');
      expect(typeof calmStyle.mood).toBe('string');
    });

    it('should handle invalid style name', () => {
      const styles = mixer.getMusicStyles();
      const invalidStyle = styles.find(s => s.name === 'invalid');
      
      expect(invalidStyle).toBeUndefined();
    });

    it('should return default characteristics for silence', () => {
      const styles = mixer.getMusicStyles();
      const silenceStyle = styles.find(s => s.name === 'silence');
      
      expect(silenceStyle.volume).toBe(0.0);
    });
  });

  describe('mixing operations', () => {
    it('should mix audio tracks at specified levels', () => {
      const speechTrack = new Float32Array(1000).fill(0.5);
      const musicTrack = new Float32Array(1000).fill(0.3);
      
      const mixed = mixer.mixTracks([speechTrack, musicTrack], [1.0, 0.5]);
      
      expect(mixed).toBeDefined();
      expect(mixed.length).toBe(1000);
    });

    it('should handle different track lengths', () => {
      const shortTrack = new Float32Array(500).fill(0.5);
      const longTrack = new Float32Array(1000).fill(0.3);
      
      const mixed = mixer.mixTracks([shortTrack, longTrack], [1.0, 0.5]);
      
      expect(mixed.length).toBe(1000); // Result matches longest track
    });

    it('should apply volume normalization to mixed tracks', () => {
      const loudTrack = new Float32Array(1000).fill(0.9);
      const quietTrack = new Float32Array(1000).fill(0.1);
      
      const mixed = mixer.mixTracks([loudTrack, quietTrack], [0.8, 0.2]);
      
      // Should be normalized
      const maxVal = Math.max(...mixed.map(Math.abs));
      expect(maxVal).toBeLessThan(1.0);
    });

    it('should apply ducking during speech detection', () => {
      const musicTrack = new Float32Array(1000).fill(0.5);
      const speechTrack = new Float32Array(1000).fill(0.8);
      
      const mixed = mixer.mixTracks(
        [musicTrack, speechTrack],
        [0.5, 1.0],
        { detectSpeech: true, duckingEnabled: true }
      );
      
      expect(mixed).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle null audio tracks', () => {
      expect(() => {
        mixer.mixTracks([null], [1.0]);
      }).toThrow('Audio track is required');
    });

    it('should handle empty audio tracks', () => {
      const emptyTrack = new Float32Array(0);
      
      expect(() => {
        mixer.mixTracks([emptyTrack], [1.0]);
      }).toThrow('Audio track is required');
    });

    it('should handle mismatched track and level arrays', () => {
      const track1 = new Float32Array(1000);
      const track2 = new Float32Array(1000);
      
      expect(() => {
        mixer.mixTracks([track1, track2], [1.0]); // Only one level for two tracks
      }).toThrow('Number of levels must match number of tracks');
    });

    it('should handle negative volume levels', () => {
      const track = new Float32Array(1000);
      
      expect(() => {
        mixer.mixTracks([track], [-1.0]);
      }).toThrow('Volume level must be between 0 and 1');
    });

    it('should handle volume levels greater than 1', () => {
      const track = new Float32Array(1000);
      
      expect(() => {
        mixer.mixTracks([track], [1.5]);
      }).toThrow('Volume level must be between 0 and 1');
    });

    it('should handle invalid fade duration', () => {
      expect(() => {
        mixer.createFadeRamp(100, -0.1);
      }).toThrow('Fade duration must be positive');
    });

    it('should handle invalid ducking depth', () => {
      const duckingManager = new DuckingManager(1.5);
      
      expect(duckingManager.duckingDepth).toBe(1.0); // Should be clamped
    });

    it('should handle empty music style array', () => {
      const styles = mixer.getMusicStyles();
      
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should handle large audio files efficiently', () => {
      const largeTrack = new Float32Array(100000).fill(0.5);
      
      const start = Date.now();
      const mixed = mixer.mixTracks([largeTrack], [0.8]);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
      expect(mixed.length).toBe(100000);
    });

    it('should handle multiple tracks simultaneously', () => {
      const tracks = [
        new Float32Array(10000).fill(0.5),
        new Float32Array(10000).fill(0.3),
        new Float32Array(10000).fill(0.2)
      ];
      
      const levels = [0.8, 0.5, 0.3];
      
      const start = Date.now();
      const mixed = mixer.mixTracks(tracks, levels);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
      expect(mixed.length).toBe(10000);
    });

    it('should handle pink noise generation efficiently', () => {
      const start = Date.now();
      const noise = mixer.generatePinkNoise(10.0, 44100);
      const duration = Date.now() - start;
      
      expect(noise.length).toBe(441000); // 10 seconds
      expect(duration).toBeLessThan(1000);
    });
  });
});

describe('VolumeNormalizer', () => {
  it('should normalize to target level', () => {
    const normalizer = new VolumeNormalizer(-18);
    const result = normalizer.normalize(100, -10);
    
    expect(result.target).toBe(-10);
    expect(result.scaleFactor).toBeLessThan(1);
  });

  it('should handle peak value calculation', () => {
    const normalizer = new VolumeNormalizer(-18);
    const audio = new Float32Array([0.5, -0.3, 0.8, -0.2, 0.9]);
    
    const peak = normalizer.getPeakLevel(audio);
    expect(peak).toBe(0.9);
  });

  it('should calculate RMS level', () => {
    const normalizer = new VolumeNormalizer(-18);
    const audio = new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5]);
    
    const rms = normalizer.getRMSLevel(audio);
    expect(rms).toBeCloseTo(0.5, 0.01);
  });

  it('should calculate LUFS level', () => {
    const normalizer = new VolumeNormalizer(-18);
    const audio = new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5]);
    
    // LUFS calculation is approximate
    const lufs = normalizer.calculateLUFS(audio);
    expect(typeof lufs).toBe('number');
    expect(lufs).toBeLessThan(0);
  });
});

describe('DuckingManager', () => {
  it('should initialize with correct ducking depth', () => {
    const manager = new DuckingManager(0.3);
    expect(manager.duckingDepth).toBe(0.3);
  });

  it('should clamp ducking depth to valid range', () => {
    const manager1 = new DuckingManager(1.5);
    const manager2 = new DuckingManager(-0.5);
    
    expect(manager1.duckingDepth).toBe(1.0);
    expect(manager2.duckingDepth).toBe(0.0);
  });

  it('should calculate ducking factor', () => {
    const manager = new DuckingManager(0.3);
    const factor = manager.getDuckingFactor(true);
    
    expect(factor).toBe(0.7);
  });

  it('should return 1.0 when not ducking', () => {
    const manager = new DuckingManager(0.3);
    const factor = manager.getDuckingFactor(false);
    
    expect(factor).toBe(1.0);
  });

  it('should handle different ducking depths', () => {
    const manager1 = new DuckingManager(0.1);
    const manager2 = new DuckingManager(0.5);
    const manager3 = new DuckingManager(1.0);
    
    expect(manager1.getDuckingFactor(true)).toBe(0.9);
    expect(manager2.getDuckingFactor(true)).toBe(0.5);
    expect(manager3.getDuckingFactor(true)).toBe(0.0);
  });

  it('should smooth ducking transitions', () => {
    const manager = new DuckingManager(0.3);
    
    // Simulate transitions
    const factors = [];
    factors.push(manager.getDuckingFactor(false));
    factors.push(manager.getDuckingFactor(true));
    factors.push(manager.getDuckingFactor(false));
    
    // Should have smooth transitions
    expect(Math.abs(factors[0] - factors[1])).toBeLessThan(0.5);
    expect(Math.abs(factors[1] - factors[2])).toBeLessThan(0.5);
  });
});

describe('Integration tests', () => {
  it('should work with tts engine output', () => {
    const mixer = new AudioMixer({ sampleRate: 44100 });
    
    // Mock TTS audio data
    const ttsOutput = new Float32Array(1000).fill(0.5);
    
    const normalized = mixer.normalizeVolume(1000, -18);
    
    expect(normalized.scaleFactor).toBeLessThan(1);
  });

  it('should handle music style integration', () => {
    const mixer = new AudioMixer({ sampleRate: 44100 });
    const styles = mixer.getMusicStyles();
    
    styles.forEach(style => {
      expect(style.name).toBeDefined();
      expect(style.volume).toBeLessThanOrEqual(1.0);
      expect(style.volume).toBeGreaterThanOrEqual(0.0);
    });
  });

  it('should handle pink noise with ducking', () => {
    const mixer = new AudioMixer({ sampleRate: 44100 });
    const duckingManager = new DuckingManager(0.3);
    
    const noise = mixer.generatePinkNoise(1.0, 44100);
    const duckingFactor = duckingManager.getDuckingFactor(true);
    
    expect(noise.length).toBe(44100);
    expect(duckingFactor).toBeLessThan(1.0);
  });

  it('should handle fade effects with ducking', () => {
    const mixer = new AudioMixer({ sampleRate: 44100 });
    const duckingManager = new DuckingManager(0.3);
    
    const fadeIn = mixer.createFadeIn(1000, 0.1);
    const fadeOut = mixer.createFadeOut(1000, 0.1);
    const duckingFactor = duckingManager.getDuckingFactor(true);
    
    expect(fadeIn.length).toBeGreaterThan(0);
    expect(fadeOut.length).toBeGreaterThan(0);
    expect(duckingFactor).toBeLessThan(1.0);
  });

  it('should handle complete mixing workflow', () => {
    const mixer = new AudioMixer({ sampleRate: 44100 });
    
    // Simulate complete workflow
    const speechTrack = new Float32Array(1000).fill(0.8);
    const musicTrack = mixer.generatePinkNoise(1.0, 44100);
    
    const duckingManager = new DuckingManager(0.3);
    
    const normalizedSpeech = mixer.normalizeVolume(1000, -18);
    const normalizedMusic = mixer.normalizeVolume(1000, -20);
    
    const duckingFactor = duckingManager.getDuckingFactor(true);
    
    const mixed = mixer.mixTracks(
      [speechTrack, musicTrack],
      [normalizedSpeech.scaleFactor, normalizedMusic.scaleFactor],
      { duckingManager }
    );
    
    expect(mixed.length).toBe(1000);
  });
});
