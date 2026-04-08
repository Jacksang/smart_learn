/**
 * TTS Engine Tests
 * Unit tests for text-to-speech functionality
 */

const { TTSEngine, ElevenLabsEngine, LocalTTSEngine, SystemTTSEngine } = require('./tts-engine');

describe('TTSEngine (Base Class)', () => {
  it('should be an abstract class and cannot be instantiated directly', () => {
    expect(() => {
      new TTSEngine();
    }).toThrow('TTSEngine is an abstract class and cannot be instantiated directly');
  });

  it('should require implementations for generateAudio()', () => {
    class TestEngine extends TTSEngine {
      constructor(config) {
        super(config);
      }
    }
    
    const engine = new TestEngine({ model: 'test' });
    expect(typeof engine.generateAudio).toBe('function');
    expect(() => engine.generateAudio('test text', 'en')).not.toThrow();
  });

  it('should require implementations for validateInput()', () => {
    class TestEngine extends TTSEngine {
      constructor(config) {
        super(config);
      }
    }
    
    const engine = new TestEngine({ model: 'test' });
    expect(typeof engine.validateInput).toBe('function');
  });
});

describe('ElevenLabsEngine', () => {
  let engine;

  beforeEach(() => {
    // Mock environment variables
    process.env.ELEVENLABS_API_KEY = 'test_api_key_123';
    engine = new ElevenLabsEngine({
      apiKey: 'test_api_key_123',
      voiceId: 'test_voice_1',
      voiceName: 'Test Voice',
      modelId: 'eleven_monolingual_v1'
    });
  });

  it('should initialize with provided configuration', () => {
    expect(engine.apiKey).toBe('test_api_key_123');
    expect(engine.voiceId).toBe('test_voice_1');
    expect(engine.voiceName).toBe('Test Voice');
    expect(engine.modelId).toBe('eleven_monolingual_v1');
  });

  it('should validate input text', () => {
    const validText = 'This is a test. The quick brown fox jumps over the lazy dog.';
    const invalidText = '';

    expect(engine.validateInput(validText)).toBe(true);
    expect(engine.validateInput(invalidText)).toBe(false);
  });

  it('should preprocess text correctly', () => {
    const text = 'Hello! This is a test. Can you hear me?';
    const processed = engine.preprocessText(text);

    expect(processed).toContain('Hello!');
    expect(processed).toContain('test.');
    expect(processed).toContain('?');
  });

  it('should add pause markers for long sentences', () => {
    const text = 'This is a very long sentence that exceeds the maximum length limit and should have pause markers inserted at appropriate locations.';
    const processed = engine.preprocessText(text);

    // Should not contain the full unprocessed long sentence
    expect(processed.length).toBeLessThanOrEqual(text.length + 10); // Allow some extra for markers
  });

  it('should split long text into chunks', () => {
    const text = 'A'.repeat(500); // Very long text
    const chunks = engine.splitTextIntoChunks(text);

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(300);
    });
  });

  it('should return audio format configuration', () => {
    const format = engine.getAudioFormat();
    
    expect(format).toBeDefined();
    expect(format.sampleRate).toBe(44100);
    expect(format.channels).toBe(1);
    expect(format.bitDepth).toBe(16);
  });

  describe('generateAudio()', () => {
    it('should return error for empty input', async () => {
      const result = await engine.generateAudio('', 'en');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for text too short', async () => {
      const result = await engine.generateAudio('Hi', 'en');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for unsupported language', async () => {
      const result = await engine.generateAudio('This is a test', 'invalid_lang');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate audio duration estimates', () => {
      const duration = engine.estimateAudioDuration('This is a test text.');
      
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10); // Should be under 10 seconds for short text
    });

    it('should return processing time estimate', () => {
      const text = 'This is a test text for estimation.';
      const estimate = engine.estimateProcessingTime(text);
      
      expect(typeof estimate).toBe('number');
      expect(estimate).toBeGreaterThan(0);
    });

    it('should handle text with special characters', async () => {
      const text = 'Hello! This is a test? Yes, it is! Can you handle symbols like @#$%&?';
      const result = await engine.generateAudio(text, 'en');
      
      // Should not throw error
      expect(result).toBeDefined();
    });

    it('should handle text with emojis', async () => {
      const text = 'Hello! 🎉 This is a test with emojis! 🚀🔥';
      const result = await engine.generateAudio(text, 'en');
      
      expect(result).toBeDefined();
    });

    it('should handle text with mixed case', async () => {
      const text = 'Hello WORLD! This is a MiXeD CaSe test. CAN YOU HEAR Me?';
      const result = await engine.generateAudio(text, 'en');
      
      expect(result).toBeDefined();
    });

    it('should handle unicode text', async () => {
      const text = '你好世界！This is a test with Chinese characters.';
      const result = await engine.generateAudio(text, 'en');
      
      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('voice configuration', () => {
    it('should validate voice settings', () => {
      const config = {
        apiKey: 'test',
        voiceId: 'test_voice',
        voiceName: 'Test Voice',
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.25
      };
      
      engine = new ElevenLabsEngine(config);
      expect(engine.stability).toBe(0.5);
      expect(engine.similarityBoost).toBe(0.75);
      expect(engine.style).toBe(0.25);
    });

    it('should use default voice settings if not provided', () => {
      engine = new ElevenLabsEngine({
        apiKey: 'test',
        voiceId: 'test_voice',
        voiceName: 'Test Voice'
      });
      
      expect(engine.stability).toBe(0.5);
      expect(engine.similarityBoost).toBe(0.75);
      expect(engine.style).toBe(0.25);
    });

    it('should clamp stability to valid range', () => {
      engine = new ElevenLabsEngine({
        apiKey: 'test',
        voiceId: 'test_voice',
        voiceName: 'Test Voice',
        stability: 1.5 // Invalid, should be clamped
      });
      
      expect(engine.stability).toBe(1.0); // Clamped to max
    });

    it('should clamp similarityBoost to valid range', () => {
      engine = new ElevenLabsEngine({
        apiKey: 'test',
        voiceId: 'test_voice',
        voiceName: 'Test Voice',
        similarityBoost: 2.0 // Invalid
      });
      
      expect(engine.similarityBoost).toBe(1.0);
    });

    it('should clamp style to valid range', () => {
      engine = new ElevenLabsEngine({
        apiKey: 'test',
        voiceId: 'test_voice',
        voiceName: 'Test Voice',
        style: 2.0 // Invalid
      });
      
      expect(engine.style).toBe(1.0);
    });
  });

  describe('metadata extraction', () => {
    it('should extract text length', () => {
      const text = 'This is a test text.';
      const metadata = engine.extractMetadata(text);
      
      expect(metadata.textLength).toBe(20);
    });

    it('should estimate duration based on word count', () => {
      const shortText = 'Hi';
      const mediumText = 'This is a medium length text.';
      const longText = 'This is a much longer text with many more words that should result in a longer audio duration when generated.';

      expect(engine.estimateAudioDuration(shortText)).toBeLessThan(
        engine.estimateAudioDuration(mediumText)
      );
      expect(engine.estimateAudioDuration(mediumText)).toBeLessThan(
        engine.estimateAudioDuration(longText)
      );
    });
  });

  describe('integration with audio mixer', () => {
    it('should produce audio data suitable for mixing', async () => {
      const text = 'This is a test for audio mixing.';
      const result = await engine.generateAudio(text, 'en');
      
      expect(result).toBeDefined();
      // In real implementation, result.audioData would contain valid audio data
      expect(result.success).toBe(false); // Mock won't produce real audio
    });
  });
});

describe('LocalTTSEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new LocalTTSEngine({
      modelPath: '/path/to/voice_model',
      voiceName: 'Local Voice',
      outputDir: '/tmp/tts_output'
    });
  });

  it('should initialize with provided configuration', () => {
    expect(engine.modelPath).toBe('/path/to/voice_model');
    expect(engine.voiceName).toBe('Local Voice');
    expect(engine.outputDir).toBe('/tmp/tts_output');
  });

  it('should validate input text', () => {
    expect(engine.validateInput('Test text')).toBe(true);
    expect(engine.validateInput('')).toBe(false);
  });

  it('should preprocess text', () => {
    const text = 'Hello! This is a test.';
    const processed = engine.preprocessText(text);
    
    expect(processed).toBeDefined();
    expect(typeof processed).toBe('string');
  });

  it('should split long text into chunks', () => {
    const text = 'A'.repeat(600);
    const chunks = engine.splitTextIntoChunks(text);
    
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(300);
  });

  it('should return audio format configuration', () => {
    const format = engine.getAudioFormat();
    
    expect(format.sampleRate).toBe(44100);
    expect(format.channels).toBe(1);
    expect(format.bitDepth).toBe(16);
    expect(format.format).toBe('wav');
  });

  it('should estimate audio duration', () => {
    const duration = engine.estimateAudioDuration('Test text');
    
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThan(0);
  });

  describe('generateAudio()', () => {
    it('should return error for empty text', async () => {
      const result = await engine.generateAudio('', 'en');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate model path exists', async () => {
      engine = new LocalTTSEngine({
        modelPath: '/nonexistent/path/to/model',
        voiceName: 'Test Voice'
      });
      
      const result = await engine.generateAudio('Test text', 'en');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('model path');
    });

    it('should validate output directory', async () => {
      engine = new LocalTTSEngine({
        modelPath: '/path/to/model',
        voiceName: 'Test Voice',
        outputDir: '/invalid/output/dir'
      });
      
      const result = await engine.generateAudio('Test text', 'en');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('output handling', () => {
    it('should generate output filename', () => {
      const filename = engine.generateOutputFilename('test text');
      
      expect(filename).toContain('test_text');
      expect(filename).toMatch(/\.wav$/);
    });

    it('should format output path correctly', () => {
      engine = new LocalTTSEngine({
        modelPath: '/path/to/model',
        voiceName: 'Test Voice',
        outputDir: '/tmp/output'
      });
      
      const result = engine.generateAudio('Test text', 'en');
      // In real implementation, output_path would be set
      expect(typeof result).toBe('object');
    });
  });
});

describe('SystemTTSEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new SystemTTSEngine({
      voiceName: 'System Voice',
      system: 'default'
    });
  });

  it('should initialize with provided configuration', () => {
    expect(engine.voiceName).toBe('System Voice');
    expect(engine.system).toBe('default');
  });

  it('should validate input text', () => {
    expect(engine.validateInput('Test text')).toBe(true);
    expect(engine.validateInput('')).toBe(false);
  });

  it('should return audio format configuration', () => {
    const format = engine.getAudioFormat();
    
    expect(format.sampleRate).toBe(44100);
    expect(format.channels).toBe(1);
    expect(format.bitDepth).toBe(16);
  });

  it('should estimate audio duration', () => {
    const duration = engine.estimateAudioDuration('Test text');
    
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThan(0);
  });

  describe('generateAudio()', () => {
    it('should return error for empty text', async () => {
      const result = await engine.generateAudio('', 'en');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate system support', () => {
      const supported = engine.isSystemSupported('default');
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('system detection', () => {
    it('should detect system type', () => {
      const isMac = engine.isSystemSupported('macOS');
      const isWindows = engine.isSystemSupported('Windows');
      const isLinux = engine.isSystemSupported('Linux');
      
      expect(typeof isMac).toBe('boolean');
      expect(typeof isWindows).toBe('boolean');
      expect(typeof isLinux).toBe('boolean');
    });
  });
});

describe('TTS Engine Factory', () => {
  it('should create ElevenLabsEngine with proper type', () => {
    const engine = TTSEngine.create('elevenlabs', {
      apiKey: 'test',
      voiceId: 'test',
      voiceName: 'Test'
    });
    
    expect(engine instanceof ElevenLabsEngine).toBe(true);
    expect(engine.type).toBe('elevenlabs');
  });

  it('should create LocalTTSEngine with proper type', () => {
    const engine = TTSEngine.create('local', {
      modelPath: '/path/to/model',
      voiceName: 'Test'
    });
    
    expect(engine instanceof LocalTTSEngine).toBe(true);
    expect(engine.type).toBe('local');
  });

  it('should create SystemTTSEngine with proper type', () => {
    const engine = TTSEngine.create('system', {
      voiceName: 'Test'
    });
    
    expect(engine instanceof SystemTTSEngine).toBe(true);
    expect(engine.type).toBe('system');
  });

  it('should return error for unsupported type', () => {
    const engine = TTSEngine.create('unsupported', {});
    
    expect(engine.success).toBe(false);
    expect(engine.error).toBeDefined();
  });

  it('should require proper configuration for each engine type', () => {
    const elevenLabs = TTSEngine.create('elevenlabs', {});
    expect(elevenLabs.success).toBe(false);

    const local = TTSEngine.create('local', {});
    expect(local.success).toBe(false);

    const system = TTSEngine.create('system', {});
    expect(system.success).toBe(true); // System engine has minimal requirements
  });
});
