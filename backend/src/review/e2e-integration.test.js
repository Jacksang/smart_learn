/**
 * E2E Integration Tests
 * End-to-end testing for Smart Learn features
 */

describe('E2E: Progress Tracking Integration', () => {
  let progressTracker;
  let progressController;

  beforeEach(() => {
    progressTracker = require('../backend/src/review/progress-tracker');
    progressController = require('../backend/src/review/progress-controller');
  });

  it('should record answer and update progress automatically', async () => {
    const tracker = new progressTracker.ProgressTracker('session_1');
    const controller = new progressController.ProgressController(tracker);

    // Record answer
    const result1 = await controller.recordAnswer('session_1', 'q_1', true, 5);

    expect(result1.success).toBe(true);

    // Get progress
    const result2 = await controller.getProgress('session_1');

    expect(result2.success).toBe(true);
    expect(result2.progress.totalQuestions).toBe(1);
    expect(result2.progress.correctAnswers).toBe(1);
    expect(result2.progress.mastery).toBe('developing');
  });

  it('should calculate weak areas after multiple attempts', async () => {
    const tracker = new progressTracker.ProgressTracker('session_2');
    const controller = new progressController.ProgressController(tracker);

    // Multiple correct answers
    await controller.recordAnswer('session_2', 'q_1', true, 5);
    await controller.recordAnswer('session_2', 'q_2', true, 5);
    await controller.recordAnswer('session_2', 'q_3', true, 5);

    // Some incorrect answers (for weak areas)
    await controller.recordAnswer('session_2', 'q_4', false, 3);
    await controller.recordAnswer('session_2', 'q_5', false, 3);

    // Get weak areas
    const result = await controller.getWeakAreas('session_2');

    expect(result.success).toBe(true);
    expect(Array.isArray(result.weakAreas)).toBe(true);
  });

  it('should identify mastery progression', async () => {
    const tracker = new progressTracker.ProgressTracker('session_3');
    const controller = new progressController.ProgressController(tracker);

    // Initial attempts
    await controller.recordAnswer('session_3', 'q_1', false, 2);
    await controller.recordAnswer('session_3', 'q_2', false, 3);

    // Gradual improvement
    await controller.recordAnswer('session_3', 'q_1', true, 3);
    await controller.recordAnswer('session_3', 'q_1', true, 4);
    await controller.recordAnswer('session_3', 'q_1', true, 5);

    const progress = await controller.getProgress('session_3');

    expect(progress.success).toBe(true);
    expect(progress.progress.mastery).toBeDefined();
  });

  it('should cache progress correctly', async () => {
    const tracker = new progressTracker.ProgressTracker('session_4');
    const controller = new progressController.ProgressController(tracker);

    await controller.recordAnswer('session_4', 'q_1', true, 5);

    // First retrieval (should use cache)
    const result1 = await controller.getProgress('session_4');

    // Second retrieval (should definitely use cache)
    const result2 = await controller.getProgress('session_4');

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.progress).toEqual(result2.progress);
  });

  it('should handle concurrent answer recording', async () => {
    const tracker = new progressTracker.ProgressTracker('session_5');
    const controller = new progressController.ProgressController(tracker);

    // Simulate concurrent recordings
    const results = await Promise.all([
      controller.recordAnswer('session_5', 'q_1', true, 5),
      controller.recordAnswer('session_5', 'q_2', true, 5),
      controller.recordAnswer('session_5', 'q_3', true, 5)
    ]);

    expect(results.every(r => r.success)).toBe(true);

    const progress = await controller.getProgress('session_5');
    expect(progress.progress.totalQuestions).toBe(3);
  });

  it('should update concept mastery with each answer', async () => {
    const tracker = new progressTracker.ProgressTracker('session_6');
    const controller = new progressController.ProgressController(tracker);

    await controller.recordAnswer('session_6', 'q_1', true, 5, 'concept_1');
    await controller.recordAnswer('session_6', 'q_2', true, 4, 'concept_1');
    await controller.recordAnswer('session_6', 'q_3', false, 3, 'concept_1');

    const progress = await controller.getProgress('session_6');

    expect(progress.progress.conceptMastery.concept_1).toBeDefined();
  });
});

describe('E2E: Voice Interaction Integration', () => {
  let voiceQuizService;
  let whisperEngine;

  beforeEach(() => {
    whisperEngine = require('../backend/src/review/whisper-cli').WhisperEngine;
    voiceQuizService = require('../backend/src/review/voice-quiz-service');
  });

  it('should transcribe and execute command automatically', async () => {
    const whisper = new whisperEngine({ model: 'small', temperature: 0 });

    // Mock transcription
    const mockTranscribe = jest.spyOn(whisper, 'transcribe');
    mockTranscribe.mockResolvedValue({
      success: true,
      data: {
        text: 'next question',
        confidence: 0.95
      }
    });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    const result = await service.executeCommand('session_1', 'next');

    expect(result.success).toBe(true);
    expect(result.command.intent).toBe('navigation');
  });

  it('should detect and handle question inputs', async () => {
    const whisper = new whisperEngine({ model: 'small', temperature: 0 });
    const mockTranscribe = jest.spyOn(whisper, 'transcribe');
    mockTranscribe.mockResolvedValue({
      success: true,
      data: {
        text: 'what is the capital of France?',
        confidence: 0.95
      }
    });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    const result = await service.recordInput('session_2', 'q_1', '/path/to/audio.wav');

    expect(result.type).toBe('answer');
    expect(result.transcription.confidence).toBe(0.95);
  });

  it('should handle command detection between answers', async () => {
    const whisper = new whisperEngine({ model: 'small', temperature: 0 });
    const mockTranscribe1 = jest.spyOn(whisper, 'transcribe');
    const mockTranscribe2 = jest.spyOn(whisper, 'transcribe');

    mockTranscribe1.mockResolvedValue({
      success: true,
      data: { text: 'what is the capital of France?', confidence: 0.95 }
    });

    mockTranscribe2.mockResolvedValue({
      success: true,
      data: { text: 'next question', confidence: 0.95 }
    });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    await service.recordInput('session_3', 'q_1', '/path/to/audio.wav');
    await service.executeCommand('session_3', 'next');

    const recordings = service.getSessionRecordings('session_3');
    expect(recordings.length).toBeGreaterThanOrEqual(2);
  });

  it('should evaluate answer similarity correctly', async () => {
    const evaluator = new voiceQuizService.AnswerEvaluator();
    const similarity = evaluator._calculateSimilarity('Paris', 'Paris');

    expect(similarity).toBe(100);
  });

  it('should handle transcription failures with retry', async () => {
    const whisper = new whisperEngine({ model: 'small', temperature: 0 });
    const mockTranscribe = jest.spyOn(whisper, 'transcribe');

    // Fail twice, succeed third time
    mockTranscribe
      .mockRejectedValueOnce(new Error('Transcription failed'))
      .mockRejectedValueOnce(new Error('Transcription failed'))
      .mockResolvedValueOnce({
        success: true,
        data: { text: 'Test', confidence: 0.95 }
      });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    const result = await service.recordInput('session_4', 'q_1', '/path/to/audio.wav');

    expect(result.success).toBe(true);
    expect(result.transcription.text).toBe('Test');
  });

  it('should parse commands correctly', async () => {
    const commandParser = require('../backend/src/review/voice-command-parser');

    const testCases = [
      { input: 'play', intent: 'playback' },
      { input: 'next', intent: 'navigation' },
      { input: 'louder', intent: 'volume' },
      { input: 'what am I on?', intent: 'information' }
    ];

    const service = new voiceQuizService.VoiceQuizService({});

    for (const testCase of testCases) {
      const result = await service.executeCommand('session_5', testCase.input);

      expect(result.success).toBe(true);
      expect(result.command.intent).toBe(testCase.intent);
    }
  });

  it('should handle voice quiz session lifecycle', async () => {
    const whisper = new whisperEngine({ model: 'small', temperature: 0 });
    const mockTranscribe = jest.spyOn(whisper, 'transcribe');
    mockTranscribe.mockResolvedValue({
      success: true,
      data: { text: 'next question', confidence: 0.95 }
    });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    // Record answer
    await service.recordInput('session_6', 'q_1', '/path/to/audio.wav');

    // Execute command
    await service.executeCommand('session_6', 'next');

    // Get session stats
    const stats = service.getSessionStats('session_6');

    expect(stats.totalRecordings).toBeGreaterThanOrEqual(1);
  });
});

describe('E2E: Narration Service Integration', () => {
  let narrationService;
  let ttsEngine;
  let audioMixer;

  beforeEach(() => {
    ttsEngine = require('../backend/src/review/tts-engine').TTSEngine;
    audioMixer = require('../backend/src/review/audio-mixer').AudioMixer;
    narrationService = require('../backend/src/review/narration-service');
  });

  it('should generate narration with TTS engine', async () => {
    const tts = new ttsEngine();
    const mockGenerate = jest.spyOn(tts, 'generateAudio');
    mockGenerate.mockResolvedValue({
      success: true,
      audioData: new Float32Array(1000).fill(0.5),
      format: 'wav'
    });

    const mixer = new audioMixer({ sampleRate: 44100 });
    const mockMix = jest.spyOn(mixer, 'mixTracks');
    mockMix.mockReturnValue(new Float32Array(1000).fill(0.3));

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('This is a test narration.');

    expect(result.success).toBe(true);
    expect(result.narrationId).toBeDefined();
    expect(result.status).toBe('processing');
  });

  it('should handle complete narration workflow', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    // Generate narration
    const genResult = await service.generateNarration('Test narration text.');
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

  it('should support background music integration', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('Test', 'en', {
      musicStyle: 'calm',
      includeMusic: true
    });

    expect(result.success).toBe(true);
  });

  it('should handle long text with auto-chunking', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const longText = 'This is a very long lesson text. '.repeat(100);

    const result = await service.generateNarration(longText);

    expect(result.success).toBe(true);
  });

  it('should track narration jobs', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const narrationId = service.generateNarrationId();

    // Manually set job status
    service.activeJobs.set(narrationId, {
      status: 'processing',
      createdAt: new Date()
    });

    const status = await service.checkNarrationStatus(narrationId);

    expect(status.status).toBe('processing');
  });

  it('should estimate processing time correctly', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const estimate = service.estimateProcessingTime('Test narration text.');

    expect(typeof estimate).toBe('number');
    expect(estimate).toBeGreaterThan(0);
    expect(estimate).toBeLessThan(60);
  });
});

describe('E2E: Complete Voice Learning Workflow', () => {
  it('should handle complete voice quiz flow', async () => {
    const whisperEngine = require('../backend/src/review/whisper-cli').WhisperEngine;
    const voiceQuizService = require('../backend/src/review/voice-quiz-service');

    const whisper = new whisperEngine({ model: 'small', temperature: 0 });
    const mockTranscribe = jest.spyOn(whisper, 'transcribe');

    // Simulate voice interactions
    mockTranscribe
      .mockResolvedValueOnce({
        success: true,
        data: { text: 'What is photosynthesis?', confidence: 0.95 }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { text: 'next question', confidence: 0.95 }
      });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    // Record question
    const q1 = await service.recordInput('session_complete', 'q_1', '/path/to/audio.wav');

    // Execute command
    await service.executeCommand('session_complete', 'next');

    const recordings = service.getSessionRecordings('session_complete');
    expect(recordings.length).toBeGreaterThanOrEqual(2);

    const stats = service.getSessionStats('session_complete');
    expect(stats.totalRecordings).toBeGreaterThanOrEqual(2);
  });

  it('should integrate progress tracking with voice interaction', async () => {
    const whisperEngine = require('../backend/src/review/whisper-cli').WhisperEngine;
    const voiceQuizService = require('../backend/src/review/voice-quiz-service');
    const progressTracker = require('../backend/src/review/progress-tracker');
    const progressController = require('../backend/src/review/progress-controller');

    const whisper = new whisperEngine({ model: 'small', temperature: 0 });
    const mockTranscribe = jest.spyOn(whisper, 'transcribe');
    mockTranscribe.mockResolvedValue({
      success: true,
      data: { text: 'yes, I understand', confidence: 0.95 }
    });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    const tracker = new progressTracker.ProgressTracker('session_integration');
    const controller = new progressController.ProgressController(tracker);

    // Record voice input
    const result = await service.recordInput('session_integration', 'q_1', '/path/to/audio.wav');

    // Record progress
    const progressResult = await controller.recordAnswer('session_integration', 'q_1', true, 5);

    expect(result.success).toBe(true);
    expect(progressResult.success).toBe(true);

    // Verify progress updated
    const progress = await controller.getProgress('session_integration');
    expect(progress.progress.totalQuestions).toBe(1);
  });

  it('should handle complete lesson with narration and quiz', async () => {
    const ttsEngine = require('../backend/src/review/tts-engine').TTSEngine;
    const audioMixer = require('../backend/src/review/audio-mixer').AudioMixer;
    const narrationService = require('../backend/src/review/narration-service');

    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    // Generate narration
    const narrationResult = await service.generateNarration('Welcome to this lesson!');

    expect(narrationResult.success).toBe(true);

    // Simulate voice quiz following narration
    const voiceQuizService = require('../backend/src/review/voice-quiz-service');
    const voiceService = new voiceQuizService.VoiceQuizService({});

    const voiceResult = await voiceService.executeCommand('session_narration', 'play');

    expect(voiceResult.success).toBe(true);
  });

  it('should maintain session state across interactions', async () => {
    const voiceQuizService = require('../backend/src/review/voice-quiz-service');
    const progressTracker = require('../backend/src/review/progress-tracker');
    const progressController = require('../backend/src/review/progress-controller');

    const voiceService = new voiceQuizService.VoiceQuizService({});
    const tracker = new progressTracker.ProgressTracker('session_state');
    const controller = new progressController.ProgressController(tracker);

    // Multiple interactions
    await voiceService.executeCommand('session_state', 'play');
    await voiceService.executeCommand('session_state', 'next');

    await controller.recordAnswer('session_state', 'q_1', true, 5);
    await voiceService.executeCommand('session_state', 'pause');
    await controller.recordAnswer('session_state', 'q_2', true, 4);

    const stats = voiceService.getSessionStats('session_state');
    expect(stats.totalRecordings).toBeGreaterThanOrEqual(2);

    const progress = await controller.getProgress('session_state');
    expect(progress.progress.totalQuestions).toBe(2);
  });
});

describe('E2E: Audio Processing Integration', () => {
  let ttsEngine;
  let audioMixer;
  let narrationService;

  beforeEach(() => {
    ttsEngine = require('../backend/src/review/tts-engine').TTSEngine;
    audioMixer = require('../backend/src/review/audio-mixer').AudioMixer;
    narrationService = require('../backend/src/review/narration-service');
  });

  it('should generate and mix audio automatically', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    // Mock TTS
    const mockGenerate = jest.spyOn(tts, 'generateAudio');
    mockGenerate.mockResolvedValue({
      success: true,
      audioData: new Float32Array(1000).fill(0.5),
      format: 'wav'
    });

    // Mock mixing
    const mockMix = jest.spyOn(mixer, 'mixTracks');
    mockMix.mockReturnValue(new Float32Array(1000).fill(0.3));

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('Test with music.', 'en', {
      musicStyle: 'calm',
      includeMusic: true
    });

    expect(result.success).toBe(true);
    expect(mockMix).toHaveBeenCalled();
  });

  it('should apply ducking to background music', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const mockGenerate = jest.spyOn(tts, 'generateAudio');
    mockGenerate.mockResolvedValue({
      success: true,
      audioData: new Float32Array(1000).fill(0.5),
      format: 'wav'
    });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('Test text.');

    expect(result.success).toBe(true);
  });

  it('should handle fade effects in narration', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const mockGenerate = jest.spyOn(tts, 'generateAudio');
    mockGenerate.mockResolvedValue({
      success: true,
      audioData: new Float32Array(1000).fill(0.5),
      format: 'wav'
    });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('Test with fades.');

    expect(result.success).toBe(true);
  });

  it('should normalize volume automatically', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('Test volume normalization.');

    expect(result.success).toBe(true);
  });

  it('should handle pink noise generation', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('Test', 'en', {
      musicStyle: 'nature',
      includeMusic: true
    });

    expect(result.success).toBe(true);
  });

  it('should manage audio files efficiently', async () => {
    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    // Generate multiple narrations
    const results = await Promise.all([
      service.generateNarration('Test 1'),
      service.generateNarration('Test 2'),
      service.generateNarration('Test 3')
    ]);

    expect(results.every(r => r.success)).toBe(true);

    const narrations = await service.listNarrations();
    expect(narrations.narrations.length).toBeGreaterThanOrEqual(3);
  });
});

describe('E2E: Error Handling Integration', () => {
  it('should handle TTS failures gracefully', async () => {
    const ttsEngine = require('../backend/src/review/tts-engine').TTSEngine;
    const audioMixer = require('../backend/src/review/audio-mixer').AudioMixer;
    const narrationService = require('../backend/src/review/narration-service');

    const tts = new ttsEngine();
    const mockGenerate = jest.spyOn(tts, 'generateAudio');
    mockGenerate.mockRejectedValue(new Error('TTS Error'));

    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.generateNarration('Test');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle transcription failures with retry', async () => {
    const whisperEngine = require('../backend/src/review/whisper-cli').WhisperEngine;
    const voiceQuizService = require('../backend/src/review/voice-quiz-service');

    const whisper = new whisperEngine({ model: 'small', temperature: 0 });
    const mockTranscribe = jest.spyOn(whisper, 'transcribe');

    // Fail 3 times, then succeed
    mockTranscribe
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockRejectedValueOnce(new Error('Error 3'))
      .mockResolvedValueOnce({
        success: true,
        data: { text: 'Success!', confidence: 0.95 }
      });

    const service = new voiceQuizService.VoiceQuizService({
      whisperEngine: whisper,
      answerEvaluator: voiceQuizService.AnswerEvaluator
    });

    const result = await service.recordInput('session_error', 'q_1', '/path/to/audio.wav');

    expect(result.success).toBe(true);
    expect(result.transcription.text).toBe('Success!');
  });

  it('should handle missing narration jobs', async () => {
    const ttsEngine = require('../backend/src/review/tts-engine').TTSEngine;
    const audioMixer = require('../backend/src/review/audio-mixer').AudioMixer;
    const narrationService = require('../backend/src/review/narration-service');

    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const result = await service.downloadNarration('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid session IDs', async () => {
    const progressTracker = require('../backend/src/review/progress-tracker');
    const progressController = require('../backend/src/review/progress-controller');

    const tracker = new progressTracker.ProgressTracker('');
    const controller = new progressController.ProgressController(tracker);

    const result = await controller.recordAnswer('', 'q_1', true, 5);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle concurrent failures gracefully', async () => {
    const ttsEngine = require('../backend/src/review/tts-engine').TTSEngine;
    const audioMixer = require('../backend/src/review/audio-mixer').AudioMixer;
    const narrationService = require('../backend/src/review/narration-service');

    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const mockGenerate = jest.spyOn(tts, 'generateAudio');
    mockGenerate.mockRejectedValue(new Error('Concurrent error'));

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const results = await Promise.all([
      service.generateNarration('Test 1'),
      service.generateNarration('Test 2'),
      service.generateNarration('Test 3')
    ]);

    expect(results.every(r => !r.success)).toBe(true);
  });
});

describe('E2E: Performance Integration', () => {
  it('should handle multiple concurrent narrations', async () => {
    const ttsEngine = require('../backend/src/review/tts-engine').TTSEngine;
    const audioMixer = require('../backend/src/review/audio-mixer').AudioMixer;
    const narrationService = require('../backend/src/review/narration-service');

    const tts = new ttsEngine();
    const mixer = new audioMixer({ sampleRate: 44100 });

    const mockGenerate = jest.spyOn(tts, 'generateAudio');
    mockGenerate.mockResolvedValue({
      success: true,
      audioData: new Float32Array(1000).fill(0.5),
      format: 'wav'
    });

    const service = new narrationService.NarrationService({
      ttsEngine: tts,
      audioMixer: mixer
    });

    const startTime = Date.now();

    const results = await Promise.all([
      service.generateNarration('Test 1'),
      service.generateNarration('Test 2'),
      service.generateNarration('Test 3'),
      service.generateNarration('Test 4'),
      service.generateNarration('Test 5')
    ]);

    const duration = Date.now() - startTime;

    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(5000); // < 5 seconds
  });

  it('should handle high-load progress tracking', async () => {
    const progressTracker = require('../backend/src/review/progress-tracker');
    const progressController = require('../backend/src/review/progress-controller');

    const tracker = new progressTracker.ProgressTracker('session_load');
    const controller = new progressController.ProgressController(tracker);

    const startTime = Date.now();

    // Multiple concurrent recordings
    await Promise.all([
      controller.recordAnswer('session_load', 'q_1', true, 5),
      controller.recordAnswer('session_load', 'q_2', true, 5),
      controller.recordAnswer('session_load', 'q_3', true, 5),
      controller.recordAnswer('session_load', 'q_4', true, 5),
      controller.recordAnswer('session_load', 'q_5', true, 5)
    ]);

    const duration = Date.now() - startTime;

    const progress = await controller.getProgress('session_load');
    expect(progress.progress.totalQuestions).toBe(5);
    expect(duration).toBeLessThan(5000);
  });

  it('should handle large dataset processing', async () => {
    const progressTracker = require('../backend/src/review/progress-tracker');

    const tracker = new progressTracker.ProgressTracker('session_large');

    // Simulate large dataset
    for (let i = 0; i < 100; i++) {
      await tracker.recordAnswer('q_' + i, true, Math.floor(Math.random() * 5) + 1);
    }

    const progress = tracker.getProgress('session_large');

    expect(progress.totalQuestions).toBe(100);
  });

  it('should maintain performance with multiple sessions', async () => {
    const voiceQuizService = require('../backend/src/review/voice-quiz-service');

    const service = new voiceQuizService.VoiceQuizService({});

    const startTime = Date.now();

    // Multiple sessions
    for (let i = 0; i < 10; i++) {
      await service.executeCommand('session_' + i, 'play');
    }

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
  });
});
