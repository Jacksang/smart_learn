/**
 * Narration Service Tests
 * Unit tests for lesson narration functionality
 */

const { NarrationService, LessonNarrationController } = require('./narration-service');
const { TTSEngine } = require('./tts-engine');
const { AudioMixer } = require('./audio-mixer');

describe('NarrationService', () => {
  let service;
  let mockTTSEngine;
  let mockAudioMixer;

  beforeEach(() => {
    mockTTSEngine = {
      generateAudio: jest.fn()
    };

    mockAudioMixer = {
      mixTracks: jest.fn(),
      generatePinkNoise: jest.fn()
    };

    service = new NarrationService({
      ttsEngine: mockTTSEngine,
      audioMixer: mockAudioMixer
    });
  });

  it('should initialize with default configuration', () => {
    expect(service.ttsEngine).toBeDefined();
    expect(service.audioMixer).toBeDefined();
    expect(service.activeJobs.size).toBe(0);
  });

  it('should generate narration ID', () => {
    const id = service.generateNarrationId();
    
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^narration_[a-zA-Z0-9]{8}$/);
  });

  describe('generateNarration()', () => {
    beforeEach(() => {
      mockTTSEngine.generateAudio.mockResolvedValue({
        success: true,
        audioData: new Float32Array(1000).fill(0.5),
        format: 'wav'
      });

      mockAudioMixer.mixTracks.mockReturnValue(new Float32Array(1000).fill(0.3));
    });

    it('should reject empty lesson text', async () => {
      const result = await service.generateNarration('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('text');
    });

    it('should reject invalid language', async () => {
      const result = await service.generateNarration('Test text', 'invalid_lang');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should generate narration with text and music', async () => {
      const result = await service.generateNarration('This is a test lesson text.');

      expect(result.success).toBe(true);
      expect(result.narrationId).toBeDefined();
      expect(result.status).toBe('processing');
    });

    it('should generate narration with specified music style', async () => {
      const result = await service.generateNarration('Test', 'en', {
        musicStyle: 'calm'
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('processing');
    });

    it('should generate narration with background music', async () => {
      const result = await service.generateNarration('Test', 'en', {
        musicStyle: 'nature',
        includeMusic: true
      });

      expect(result.success).toBe(true);
    });

    it('should handle long text with pause markers', async () => {
      const longText = 'This is a very long lesson text that exceeds the maximum length limit for single audio generation and should be split into multiple segments with appropriate pause markers inserted at natural break points.';

      const result = await service.generateNarration(longText);

      expect(result.success).toBe(true);
      expect(result.narrationId).toBeDefined();
    });

    it('should estimate processing time', () => {
      const text = 'This is a test text for estimation.';
      const estimate = service.estimateProcessingTime(text);

      expect(typeof estimate).toBe('number');
      expect(estimate).toBeGreaterThan(0);
    });

    it('should return processing time for given text', () => {
      const estimate = service.estimateProcessingTime('Test');
      expect(estimate).toBeLessThan(60); // Under 60 seconds
    });

    it('should handle text with special characters', async () => {
      const result = await service.generateNarration('Hello! This is a test? Yes, it is! @#$%&');

      expect(result.success).toBe(true);
    });

    it('should handle text with emojis', async () => {
      const result = await service.generateNarration('Hello! 🎉 Test! 🚀🔥');

      expect(result.success).toBe(true);
    });

    it('should handle text with unicode characters', async () => {
      const result = await service.generateNarration('你好世界！This is a test with Chinese.');

      expect(result.success).toBe(true);
    });

    it('should handle mixed case text', async () => {
      const result = await service.generateNarration('Hello WORLD! This is a MiXeD CaSe test.');

      expect(result.success).toBe(true);
    });

    it('should return narration ID for tracking', async () => {
      const result = await service.generateNarration('Test');

      expect(result.narrationId).toBeDefined();
      expect(typeof result.narrationId).toBe('string');
    });

    it('should update status to processing immediately', async () => {
      const result = await service.generateNarration('Test');

      expect(result.status).toBe('processing');
    });

    it('should queue narration job', async () => {
      const result = await service.generateNarration('Test');

      expect(result.success).toBe(true);
      expect(service.activeJobs.has(result.narrationId)).toBe(true);
    });
  });

  describe('checkNarrationStatus()', () => {
    it('should return NOT_STARTED for non-existent narration', async () => {
      const result = await service.checkNarrationStatus('nonexistent_narration');

      expect(result.success).toBe(false);
      expect(result.status).toBe('not_found');
    });

    it('should return processing status for active job', async () => {
      const narrationId = service.generateNarrationId();
      
      // Manually add to active jobs
      service.activeJobs.set(narrationId, {
        status: 'processing',
        createdAt: new Date()
      });

      const result = await service.checkNarrationStatus(narrationId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('processing');
    });

    it('should return completed status for finished job', async () => {
      const narrationId = service.generateNarrationId();
      
      service.activeJobs.set(narrationId, {
        status: 'completed',
        createdAt: new Date()
      });

      const result = await service.checkNarrationStatus(narrationId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
    });

    it('should return failed status for failed job', async () => {
      const narrationId = service.generateNarrationId();
      
      service.activeJobs.set(narrationId, {
        status: 'failed',
        createdAt: new Date()
      });

      const result = await service.checkNarrationStatus(narrationId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('failed');
    });
  });

  describe('downloadNarration()', () => {
    it('should return error for non-existent narration', async () => {
      const result = await service.downloadNarration('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return narration data for completed job', async () => {
      const narrationId = service.generateNarrationId();
      
      service.activeJobs.set(narrationId, {
        status: 'completed',
        data: {
          audioData: new Float32Array(1000).fill(0.5),
          format: 'wav'
        },
        createdAt: new Date()
      });

      const result = await service.downloadNarration(narrationId);

      expect(result.success).toBe(true);
      expect(result.audioData).toBeDefined();
    });

    it('should return error for processing narration', async () => {
      const narrationId = service.generateNarrationId();
      
      service.activeJobs.set(narrationId, {
        status: 'processing',
        createdAt: new Date()
      });

      const result = await service.downloadNarration(narrationId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('processing');
    });
  });

  describe('deleteNarration()', () => {
    it('should delete existing narration', async () => {
      const narrationId = service.generateNarrationId();
      
      service.activeJobs.set(narrationId, {
        status: 'completed',
        createdAt: new Date()
      });

      const result = await service.deleteNarration(narrationId);

      expect(result.success).toBe(true);
      expect(service.activeJobs.has(narrationId)).toBe(false);
    });

    it('should return error for non-existent narration', async () => {
      const result = await service.deleteNarration('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('listNarrations()', () => {
    beforeEach(() => {
      service.activeJobs.set('narration_001', {
        status: 'completed',
        createdAt: new Date(),
        text: 'Test narration 1'
      });
      service.activeJobs.set('narration_002', {
        status: 'completed',
        createdAt: new Date(),
        text: 'Test narration 2'
      });
    });

    it('should return list of all narrations', async () => {
      const result = await service.listNarrations();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.narrations)).toBe(true);
      expect(result.narrations.length).toBe(2);
    });

    it('should filter by status', async () => {
      const result = await service.listNarrations({ status: 'completed' });

      expect(result.success).toBe(true);
      expect(result.narrations.length).toBe(2);
    });

    it('should limit results', async () => {
      const result = await service.listNarrations({ limit: 1 });

      expect(result.success).toBe(true);
      expect(result.narrations.length).toBeLessThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const result = await service.listNarrations({ limit: 1, offset: 0 });

      expect(result.success).toBe(true);
      expect(result.narrations.length).toBeLessThanOrEqual(1);
    });
  });

  describe('error handling', () => {
    it('should handle TTS engine failure', async () => {
      mockTTSEngine.generateAudio.mockRejectedValue(new Error('TTS Error'));

      const result = await service.generateNarration('Test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle audio mixer failure', async () => {
      mockAudioMixer.mixTracks.mockImplementation(() => {
        throw new Error('Audio Mixer Error');
      });

      const result = await service.generateNarration('Test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid configuration', () => {
      const badService = new NarrationService({
        ttsEngine: null,
        audioMixer: null
      });

      expect(() => badService.generateNarration('Test')).toThrow();
    });

    it('should handle memory overflow for very large texts', async () => {
      const hugeText = 'A'.repeat(100000);

      const result = await service.generateNarration(hugeText);

      // Should handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle concurrent requests', async () => {
      const results = await Promise.all([
        service.generateNarration('Test 1'),
        service.generateNarration('Test 2'),
        service.generateNarration('Test 3')
      ]);

      expect(results.every(r => r.success)).toBe(true);
      expect(new Set(results.map(r => r.narrationId)).size).toBe(3);
    });
  });

  describe('performance', () => {
    it('should handle multiple concurrent narrations', async () => {
      const narrations = [];
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        narrations.push(service.generateNarration(`Test ${i}`));
      }

      const results = await Promise.all(narrations);
      const duration = Date.now() - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    it('should handle large text processing', async () => {
      const longText = 'This is a test. '.repeat(100);
      const startTime = Date.now();

      const result = await service.generateNarration(longText);

      expect(result.success).toBe(true);
      expect(Date.now() - startTime).toBeLessThan(5000);
    });

    it('should maintain separate jobs for different narrations', async () => {
      await service.generateNarration('Test 1');
      await service.generateNarration('Test 2');

      const allIds = Array.from(service.activeJobs.keys());
      expect(allIds.length).toBeGreaterThanOrEqual(2);
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });

  describe('job lifecycle', () => {
    it('should transition from processing to completed', async () => {
      const result = await service.generateNarration('Test');
      const narrationId = result.narrationId;

      expect(result.status).toBe('processing');

      // Simulate completion
      const job = service.activeJobs.get(narrationId);
      if (job) {
        job.status = 'completed';
      }

      const status = await service.checkNarrationStatus(narrationId);
      expect(status.status).toBe('completed');
    });

    it('should handle job failure', async () => {
      const narrationId = service.generateNarrationId();

      service.activeJobs.set(narrationId, {
        status: 'processing',
        createdAt: new Date()
      });

      // Simulate failure
      const job = service.activeJobs.get(narrationId);
      if (job) {
        job.status = 'failed';
      }

      const status = await service.checkNarrationStatus(narrationId);
      expect(status.status).toBe('failed');
    });

    it('should cleanup finished jobs automatically', async () => {
      const narrationId = service.generateNarrationId();

      service.activeJobs.set(narrationId, {
        status: 'completed',
        createdAt: new Date()
      });

      expect(service.activeJobs.has(narrationId)).toBe(true);

      // Manually trigger cleanup
      service.cleanupJobs();

      // Should still be there (cleanup runs periodically)
      expect(service.activeJobs.has(narrationId)).toBe(true);
    });
  });

  describe('metadata extraction', () => {
    it('should extract text length', () => {
      const text = 'This is a test.';
      const length = service.extractMetadata(text).textLength;

      expect(typeof length).toBe('number');
      expect(length).toBe(16);
    });

    it('should estimate audio duration', () => {
      const duration = service.estimateAudioDuration('Test text');

      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThan(0);
    });

    it('should calculate word count', () => {
      const text = 'This is a test with several words.';
      const count = service.extractMetadata(text).wordCount;

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('integration with components', () => {
    it('should work with TTSEngine', async () => {
      const result = await service.generateNarration('Test');

      expect(result.success).toBe(true);
    });

    it('should work with AudioMixer', async () => {
      const result = await service.generateNarration('Test', 'en', {
        musicStyle: 'calm',
        includeMusic: true
      });

      expect(result.success).toBe(true);
    });

    it('should handle complete workflow', async () => {
      // Generate narration
      const genResult = await service.generateNarration('Test lesson text.');
      expect(genResult.success).toBe(true);

      // Check status
      const statusResult = await service.checkNarrationStatus(genResult.narrationId);
      expect(statusResult.success).toBe(true);

      // List narrations
      const listResult = await service.listNarrations();
      expect(listResult.success).toBe(true);

      // Delete narration
      const deleteResult = await service.deleteNarration(genResult.narrationId);
      expect(deleteResult.success).toBe(true);
    });
  });
});

describe('NarrationService Configuration', () => {
  it('should use default TTS model', () => {
    const service = new NarrationService({});
    expect(service.ttsEngine).toBeDefined();
  });

  it('should use custom configuration', () => {
    const service = new NarrationService({
      ttsEngine: mockTTSEngine,
      audioMixer: mockAudioMixer
    });
    
    expect(service.ttsEngine).toBe(mockTTSEngine);
  });

  it('should handle null TTS engine', () => {
    expect(() => {
      new NarrationService({ ttsEngine: null, audioMixer: mockAudioMixer });
    }).toThrow();
  });

  it('should handle null audio mixer', () => {
    expect(() => {
      new NarrationService({ ttsEngine: mockTTSEngine, audioMixer: null });
    }).toThrow();
  });

  it('should handle both null engines', () => {
    expect(() => {
      new NarrationService({ ttsEngine: null, audioMixer: null });
    }).toThrow();
  });

  it('should validate required configuration', () => {
    const service = new NarrationService({});
    
    expect(service.ttsEngine).toBeDefined();
    expect(service.audioMixer).toBeDefined();
  });
});
