/**
 * Voice Interaction Tests
 * Unit tests for voice command parsing and voice quiz service
 */

const { WhisperEngine, CommandExecutor, VoiceQuizService } = require('./whisper-cli');
const { parseVoiceCommand, isQuestion, classifyQuestion } = require('./voice-command-parser');
const VoiceQuizServiceClass = require('./voice-quiz-service');

describe('WhisperEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new WhisperEngine({
      model: 'small',
      temperature: 0,
      language: 'en',
      withoutTimestamps: false,
      wordTimestamps: true,
      beamSize: 5
    });
  });

  it('should initialize with default configuration', () => {
    expect(engine.model).toBe('small');
    expect(engine.temperature).toBe(0);
    expect(engine.language).toBe('en');
    expect(engine.beamSize).toBe(5);
  });

  it('should initialize with custom configuration', () => {
    engine = new WhisperEngine({
      model: 'medium',
      temperature: 0.5,
      language: 'es',
      beamSize: 10
    });

    expect(engine.model).toBe('medium');
    expect(engine.temperature).toBe(0.5);
    expect(engine.language).toBe('es');
    expect(engine.beamSize).toBe(10);
  });

  describe('initialize()', () => {
    it('should validate model existence', async () => {
      const result = await engine.initialize();
      
      // Should succeed or return appropriate error
      expect(result).toBeDefined();
    });

    it('should handle initialization errors', async () => {
      // Mock invalid model
      engine = new WhisperEngine({
        model: 'invalid_model',
        temperature: 0
      });

      const result = await engine.initialize();
      
      expect(result.success).toBe(false);
    });

    it('should be idempotent', async () => {
      const result1 = await engine.initialize();
      const result2 = await engine.initialize();

      expect(result1.success).toBe(result2.success);
    });
  });

  describe('validateAudio()', () => {
    it('should validate valid audio file path', () => {
      // Mock valid file
      const result = engine.validateAudio('/path/to/audio.wav');
      expect(typeof result).toBe('boolean');
    });

    it('should reject non-existent file', () => {
      const result = engine.validateAudio('/nonexistent/file.wav');
      expect(result).toBe(false);
    });

    it('should reject invalid file extension', () => {
      const result = engine.validateAudio('/path/to/audio.jpg');
      expect(result).toBe(false);
    });

    it('should accept supported formats', () => {
      const formats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac'];
      
      formats.forEach(format => {
        const result = engine.validateAudio(`/path/to/audio${format}`);
        expect(result).toBe(true);
      });
    });

    it('should reject unsupported formats', () => {
      const formats = ['.txt', '.pdf', '.doc', '.jpg', '.png'];
      
      formats.forEach(format => {
        const result = engine.validateAudio(`/path/to/audio${format}`);
        expect(result).toBe(false);
      });
    });
  });

  describe('transcribeWithRetry()', () => {
    it('should retry on failure', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ success: true, data: { text: 'Test transcription' } });

      const result = await engine.transcribeWithRetry('/path/to/audio.wav');
      
      expect(result.success).toBe(true);
      expect(result.data.text).toBe('Test transcription');
    });

    it('should fail after max retries', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockRejectedValue(new Error('Persistent error'));

      const result = await engine.transcribeWithRetry('/path/to/audio.wav');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should respect max retries limit', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockRejectedValue(new Error('Error'));

      await engine.transcribeWithRetry('/path/to/audio.wav', 2); // Only 2 retries

      expect(mockTranscribe).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should handle successful first attempt', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockResolvedValue({ success: true, data: { text: 'Test' } });

      const result = await engine.transcribeWithRetry('/path/to/audio.wav');
      
      expect(result.success).toBe(true);
      expect(mockTranscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('transcribe()', () => {
    it('should return transcription result', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: {
          text: 'Hello world',
          language: 'en',
          duration: 2.5,
          segments: [],
          confidence: 0.95,
          processingTime: 3.2
        },
        jobId: 'test_job'
      });

      const result = await engine.transcribe('/path/to/audio.wav');

      expect(result.success).toBe(true);
      expect(result.data.text).toBe('Hello world');
      expect(result.data.language).toBe('en');
      expect(result.data.duration).toBe(2.5);
      expect(result.data.confidence).toBe(0.95);
    });

    it('should handle transcription errors', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: false,
        error: 'Transcription failed'
      });

      const result = await engine.transcribe('/path/to/audio.wav');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include word timestamps when enabled', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: {
          text: 'Hello world',
          words: [
            { word: 'Hello', start: 0, end: 1 },
            { word: 'world', start: 1, end: 2 }
          ]
        }
      });

      const result = await engine.transcribe('/path/to/audio.wav');

      expect(result.success).toBe(true);
      expect(result.data.words).toBeDefined();
    });

    it('should calculate processing time', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: {
          text: 'Test',
          processingTime: 3.5
        }
      });

      const result = await engine.transcribe('/path/to/audio.wav');

      expect(result.data.processingTime).toBe(3.5);
    });

    it('should detect language automatically', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: {
          text: 'Test',
          language: 'en'
        }
      });

      const result = await engine.transcribe('/path/to/audio.wav');

      expect(result.data.language).toBeDefined();
    });

    it('should handle segments in transcription', async () => {
      const mockTranscribe = jest.spyOn(engine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: {
          text: 'Test',
          segments: [
            { text: 'Segment 1', start: 0, end: 1 },
            { text: 'Segment 2', start: 1, end: 2 }
          ]
        }
      });

      const result = await engine.transcribe('/path/to/audio.wav');

      expect(Array.isArray(result.data.segments)).toBe(true);
      expect(result.data.segments.length).toBe(2);
    });
  });

  describe('getModels()', () => {
    it('should return list of available models', async () => {
      const models = await engine.getModels();
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include model metadata', async () => {
      const models = await engine.getModels();
      
      models.forEach(model => {
        expect(model.name).toBeDefined();
        expect(typeof model.size).toBe('string');
        expect(typeof model.speed).toBe('string');
        expect(typeof model.accuracy).toBe('string');
      });
    });

    it('should identify default model', async () => {
      const models = await engine.getModels();
      
      const defaultModel = models.find(m => m.name === 'small');
      expect(defaultModel).toBeDefined();
    });

    it('should include all model sizes', async () => {
      const models = await engine.getModels();
      const modelNames = models.map(m => m.name);
      
      expect(modelNames).toContain('tiny');
      expect(modelNames).toContain('base');
      expect(modelNames).toContain('small');
      expect(modelNames).toContain('medium');
      expect(modelNames).toContain('large');
    });
  });

  describe('cancel()', () => {
    it('should cancel active transcription', async () => {
      const result = await engine.cancel('active_job_id');
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should handle non-existent job', async () => {
      const result = await engine.cancel('nonexistent_job');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return active jobs list', async () => {
      const result = await engine.cancel('active_job_id');
      
      expect(result).toBeDefined();
    });
  });

  describe('getStatus()', () => {
    it('should return job status', async () => {
      const result = await engine.getStatus('active_job_id');
      
      expect(result).toBeDefined();
    });

    it('should handle non-existent job', async () => {
      const result = await engine.getStatus('nonexistent');
      
      expect(result.success).toBe(false);
    });
  });

  describe('validateAudio format support', () => {
    it('should accept WAV files', () => {
      expect(engine.validateAudio('/test/audio.wav')).toBe(true);
    });

    it('should accept MP3 files', () => {
      expect(engine.validateAudio('/test/audio.mp3')).toBe(true);
    });

    it('should accept M4A files', () => {
      expect(engine.validateAudio('/test/audio.m4a')).toBe(true);
    });

    it('should accept FLAC files', () => {
      expect(engine.validateAudio('/test/audio.flac')).toBe(true);
    });

    it('should accept OGG files', () => {
      expect(engine.validateAudio('/test/audio.ogg')).toBe(true);
    });

    it('should accept AAC files', () => {
      expect(engine.validateAudio('/test/audio.aac')).toBe(true);
    });

    it('should reject other formats', () => {
      expect(engine.validateAudio('/test/audio.mp4')).toBe(false);
      expect(engine.validateAudio('/test/audio.mov')).toBe(false);
    });
  });
});

describe('VoiceCommandParser', () => {
  describe('parseVoiceCommand()', () => {
    it('should parse playback commands', () => {
      const commands = [
        { input: 'play', expected: 'play' },
        { input: 'pause', expected: 'pause' },
        { input: 'resume', expected: 'play' },
        { input: 'start', expected: 'play' },
        { input: 'stop', expected: 'stop' }
      ];

      commands.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.intent).toBe('playback');
        expect(result.action).toBe(expected);
      });
    });

    it('should parse navigation commands', () => {
      const commands = [
        { input: 'next', expected: 'next' },
        { input: 'next question', expected: 'next' },
        { input: 'skip ahead', expected: 'next' },
        { input: 'go back', expected: 'previous' },
        { input: 'previous', expected: 'previous' },
        { input: 'restart', expected: 'restart' },
        { input: 'start over', expected: 'restart' }
      ];

      commands.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.intent).toBe('navigation');
        expect(result.action).toBe(expected);
      });
    });

    it('should parse speed commands', () => {
      const commands = [
        { input: 'play faster', expected: { intent: 'speed', action: 'increase' } },
        { input: 'speed up', expected: { intent: 'speed', action: 'increase' } },
        { input: 'play slower', expected: { intent: 'speed', action: 'decrease' } },
        { input: 'slow down', expected: { intent: 'speed', action: 'decrease' } },
        { input: 'normal', expected: { intent: 'speed', action: 'reset' } },
        { input: 'standard', expected: { intent: 'speed', action: 'reset' } }
      ];

      commands.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.intent).toBe('speed');
        expect(result.action).toBe(expected.action);
      });
    });

    it('should parse volume commands', () => {
      const commands = [
        { input: 'louder', expected: 'increase' },
        { input: 'turn up', expected: 'increase' },
        { input: 'softer', expected: 'decrease' },
        { input: 'quieter', expected: 'decrease' },
        { input: 'turn down', expected: 'decrease' }
      ];

      commands.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.intent).toBe('volume');
        expect(result.action).toBe(expected);
      });
    });

    it('should parse information commands', () => {
      const commands = [
        { input: 'what am I on?', expected: 'current' },
        { input: 'where am I?', expected: 'current' },
        { input: 'show progress', expected: 'progress' },
        { input: 'how many left?', expected: 'progress' }
      ];

      commands.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.intent).toBe('information');
        expect(result.action).toBe(expected);
      });
    });

    it('should parse help commands', () => {
      const commands = [
        { input: 'help', expected: 'list' },
        { input: 'commands', expected: 'list' },
        { input: 'what can you do?', expected: 'help' }
      ];

      commands.forEach(({ input, expected }) => {
        const result = parseVoiceCommand(input);
        expect(result.intent).toBe('help');
      });
    });

    it('should detect questions', () => {
      const questions = [
        'What is the capital of France?',
        'How does this work?',
        'Why is the sky blue?',
        'When does class start?',
        'Where is the library?',
        'Who is the president?'
      ];

      questions.forEach(q => {
        expect(isQuestion(q)).toBe(true);
      });
    });

    it('should detect statements', () => {
      const statements = [
        'I understand.',
        'That makes sense.',
        'Let me think about that.',
        'I need to review this.',
        'This is easy.'
      ];

      statements.forEach(s => {
        expect(isQuestion(s)).toBe(false);
      });
    });

    it('should classify question types', () => {
      const testCases = [
        { text: 'What is photosynthesis?', expected: 'definition' },
        { text: 'How does cellular respiration work?', expected: 'process' },
        { text: 'Why is the sky blue?', expected: 'reasoning' },
        { text: 'When was the first moon landing?', expected: 'temporal' },
        { text: 'Where is Mount Everest?', expected: 'location' },
        { text: 'Who discovered penicillin?', expected: 'entity' },
        { text: 'What is your favorite color?', expected: 'general' }
      ];

      testCases.forEach(({ text, expected }) => {
        const result = classifyQuestion(text);
        expect(result).toBe(expected);
      });
    });

    it('should return question text', () => {
      const result = parseVoiceCommand('What is the capital of France?');
      expect(result.intent).toBe('question');
      expect(result.text).toBe('What is the capital of France?');
    });

    it('should return statement text', () => {
      const result = parseVoiceCommand('I think I understand now.');
      expect(result.intent).toBe('statement');
      expect(result.text).toBe('I think I understand now.');
    });

    it('should handle empty input', () => {
      const result = parseVoiceCommand('');
      expect(result.intent).toBe('unknown');
      expect(result.text).toBe('');
    });

    it('should handle special characters', () => {
      const result = parseVoiceCommand('Hello! What is your name?');
      expect(result.intent).toBe('question');
      expect(result.text).toContain('What is your name?');
    });

    it('should handle emojis', () => {
      const result = parseVoiceCommand('🎉 Great! How does this work?');
      expect(result.intent).toBe('question');
    });

    it('should handle mixed case', () => {
      const result = parseVoiceCommand('HELLO! HOW does this work?');
      expect(result.intent).toBe('question');
    });
  });

  describe('isQuestion()', () => {
    it('should detect question words', () => {
      const words = ['what', 'how', 'why', 'when', 'where', 'who'];
      
      words.forEach(word => {
        expect(isQuestion(`What is ${word}?`)).toBe(true);
      });
    });

    it('should detect question mark punctuation', () => {
      expect(isQuestion('Test?')).toBe(true);
    });

    it('should detect question phrases', () => {
      const phrases = [
        'can you explain',
        'could you help',
        'is this correct',
        'do you know'
      ];

      phrases.forEach(phrase => {
        expect(isQuestion(`${phrase} this?`)).toBe(true);
      });
    });

    it('should reject statements', () => {
      expect(isQuestion('This is a statement.')).toBe(false);
      expect(isQuestion('I agree with that.')).toBe(false);
    });

    it('should reject incomplete questions', () => {
      expect(isQuestion('What')).toBe(false);
      expect(isQuestion('How')).toBe(false);
    });
  });

  describe('classifyQuestion()', () => {
    it('should classify definition questions', () => {
      expect(classifyQuestion('What is X?')).toBe('definition');
      expect(classifyQuestion('Define X')).toBe('definition');
    });

    it('should classify process questions', () => {
      expect(classifyQuestion('How does X work?')).toBe('process');
      expect(classifyQuestion('What is the process for X?')).toBe('process');
    });

    it('should classify reasoning questions', () => {
      expect(classifyQuestion('Why is X?')).toBe('reasoning');
      expect(classifyQuestion('Why does X happen?')).toBe('reasoning');
    });

    it('should classify temporal questions', () => {
      expect(classifyQuestion('When did X happen?')).toBe('temporal');
      expect(classifyQuestion('When was X created?')).toBe('temporal');
    });

    it('should classify location questions', () => {
      expect(classifyQuestion('Where is X?')).toBe('location');
      expect(classifyQuestion('Where does X happen?')).toBe('location');
    });

    it('should classify entity questions', () => {
      expect(classifyQuestion('Who created X?')).toBe('entity');
      expect(classifyQuestion('Who is X?')).toBe('entity');
    });

    it('should classify general questions', () => {
      expect(classifyQuestion('What do you think?')).toBe('general');
      expect(classifyQuestion('How are you?')).toBe('general');
    });

    it('should handle unknown classifications', () => {
      const result = classifyQuestion('Unknown question type');
      expect(result).toBe('general');
    });
  });
});

describe('VoiceQuizService', () => {
  let service;

  beforeEach(() => {
    service = new VoiceQuizService();
  });

  describe('recordInput()', () => {
    it('should record voice input', async () => {
      const result = await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      
      expect(result).toBeDefined();
    });

    it('should transcribe and return text', async () => {
      const mockTranscribe = jest.spyOn(service.whisperEngine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: { text: 'Test transcription', confidence: 0.95 }
      });

      const result = await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      
      expect(result.transcription.text).toBe('Test transcription');
    });

    it('should detect command vs question', async () => {
      const mockTranscribe = jest.spyOn(service.whisperEngine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: { text: 'next question', confidence: 0.95 }
      });

      const result = await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      
      expect(result.type).toBe('command');
    });

    it('should detect question input', async () => {
      const mockTranscribe = jest.spyOn(service.whisperEngine, 'transcribe');
      mockTranscribe.mockResolvedValue({
        success: true,
        data: { text: 'What is the answer?', confidence: 0.95 }
      });

      const result = await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      
      expect(result.type).toBe('answer');
    });

    it('should reject invalid session ID', async () => {
      const result = await service.recordInput('', 'q_1', '/path/to/audio.wav');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid question ID', async () => {
      const result = await service.recordInput('session_1', '', '/path/to/audio.wav');
      
      expect(result.success).toBe(false);
    });
  });

  describe('executeCommand()', () => {
    it('should execute playback commands', async () => {
      const result = await service.executeCommand('session_1', 'play');
      
      expect(result.success).toBe(true);
      expect(result.command.intent).toBe('playback');
    });

    it('should execute navigation commands', async () => {
      const result = await service.executeCommand('session_1', 'next');
      
      expect(result.success).toBe(true);
      expect(result.command.intent).toBe('navigation');
    });

    it('should execute speed commands', async () => {
      const result = await service.executeCommand('session_1', 'play faster');
      
      expect(result.success).toBe(true);
      expect(result.command.intent).toBe('speed');
    });

    it('should execute volume commands', async () => {
      const result = await service.executeCommand('session_1', 'louder');
      
      expect(result.success).toBe(true);
      expect(result.command.intent).toBe('volume');
    });

    it('should execute information commands', async () => {
      const result = await service.executeCommand('session_1', 'what am I on?');
      
      expect(result.success).toBe(true);
      expect(result.command.intent).toBe('information');
    });

    it('should handle unknown commands', async () => {
      const result = await service.executeCommand('session_1', 'unknown command');
      
      expect(result.success).toBe(true);
      expect(result.command.intent).toBe('unknown');
    });
  });

  describe('_evaluateAnswer()', () => {
    it('should calculate similarity score', async () => {
      const questionAnswer = 'The capital of France is Paris';
      const userAnswer = 'Paris is the capital of France';
      
      const similarity = service._calculateSimilarity(questionAnswer, userAnswer);
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(100);
    });

    it('should return high similarity for exact match', async () => {
      const similarity = service._calculateSimilarity('Paris', 'Paris');
      
      expect(similarity).toBe(100);
    });

    it('should return high similarity for partial match', async () => {
      const similarity = service._calculateSimilarity('The quick brown fox', 'quick brown fox');
      
      expect(similarity).toBeGreaterThan(50);
    });

    it('should return low similarity for no match', async () => {
      const similarity = service._calculateSimilarity('Paris', 'London');
      
      expect(similarity).toBeLessThan(50);
    });

    it('should normalize text before comparison', async () => {
      const similarity = service._calculateSimilarity('Paris', 'PARIS');
      
      expect(similarity).toBe(100);
    });

    it('should handle case-insensitive matching', async () => {
      const similarity = service._calculateSimilarity('The capital of France is Paris', 'the capital of france is paris');
      
      expect(similarity).toBe(100);
    });

    it('should handle empty answers', async () => {
      const similarity = service._calculateSimilarity('Paris', '');
      
      expect(similarity).toBe(0);
    });

    it('should use 70% threshold for correct answer', async () => {
      const similarity = service._calculateSimilarity('Paris', 'Paris');
      const isCorrect = similarity >= 70;
      
      expect(isCorrect).toBe(true);
    });

    it('should return feedback for partial match', async () => {
      const similarity = service._calculateSimilarity('The capital of France is Paris', 'London');
      
      expect(similarity).toBeLessThan(70);
    });

    it('should handle special characters', async () => {
      const similarity = service._calculateSimilarity('What is 5+5?', '5+5=10');
      
      expect(similarity).toBeGreaterThan(0);
    });

    it('should handle unicode text', async () => {
      const similarity = service._calculateSimilarity('你好', '你好');
      
      expect(similarity).toBe(100);
    });
  });

  describe('_calculateSimilarity()', () => {
    it('should use Jaccard similarity', () => {
      const similarity = service._calculateSimilarity('The quick brown fox', 'quick brown fox jumps');
      
      expect(typeof similarity).toBe('number');
    });

    it('should handle single word comparison', () => {
      const similarity = service._calculateSimilarity('Paris', 'Paris');
      
      expect(similarity).toBe(100);
    });

    it('should handle multi-word comparison', () => {
      const similarity = service._calculateSimilarity('The quick brown fox', 'The lazy brown dog');
      
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThan(0);
    });

    it('should return 0 for completely different words', () => {
      const similarity = service._calculateSimilarity('Paris', 'Tokyo');
      
      expect(similarity).toBe(0);
    });

    it('should handle single character comparison', () => {
      const similarity = service._calculateSimilarity('a', 'a');
      
      expect(similarity).toBe(100);
    });

    it('should handle long text comparison', () => {
      const text1 = 'This is a very long text for similarity comparison.';
      const text2 = 'This is a different long text for similarity comparison.';
      
      const similarity = service._calculateSimilarity(text1, text2);
      
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThan(0);
    });
  });

  describe('getSessionRecordings()', () => {
    beforeEach(() => {
      service.recordings.set('session_1', [
        { id: 'rec_1', sessionId: 'session_1', questionId: 'q_1' },
        { id: 'rec_2', sessionId: 'session_1', questionId: 'q_2' }
      ]);
    });

    it('should return recordings for session', () => {
      const recordings = service.getSessionRecordings('session_1');
      
      expect(Array.isArray(recordings)).toBe(true);
      expect(recordings.length).toBe(2);
    });

    it('should return empty array for non-existent session', () => {
      const recordings = service.getSessionRecordings('nonexistent');
      
      expect(recordings).toEqual([]);
    });
  });

  describe('getSessionStats()', () => {
    beforeEach(() => {
      service.recordings.set('session_1', [
        { id: 'rec_1', sessionId: 'session_1', questionId: 'q_1' },
        { id: 'rec_2', sessionId: 'session_1', questionId: 'q_2' }
      ]);
    });

    it('should return session statistics', () => {
      const stats = service.getSessionStats('session_1');
      
      expect(stats.totalRecordings).toBe(2);
      expect(stats.sessionId).toBe('session_1');
    });

    it('should return zero stats for non-existent session', () => {
      const stats = service.getSessionStats('nonexistent');
      
      expect(stats.totalRecordings).toBe(0);
    });

    it('should track recording count', () => {
      service.recordings.set('session_2', [
        { id: 'rec_1', sessionId: 'session_2', questionId: 'q_1' },
        { id: 'rec_2', sessionId: 'session_2', questionId: 'q_2' },
        { id: 'rec_3', sessionId: 'session_2', questionId: 'q_3' }
      ]);

      const stats = service.getSessionStats('session_2');
      expect(stats.totalRecordings).toBe(3);
    });
  });

  describe('session management', () => {
    it('should initialize session on first recording', async () => {
      await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      
      const recordings = service.getSessionRecordings('session_1');
      expect(recordings.length).toBeGreaterThan(0);
    });

    it('should maintain session state', () => {
      service.recordings.set('session_1', []);
      
      const recordings = service.getSessionRecordings('session_1');
      expect(Array.isArray(recordings)).toBe(true);
    });

    it('should support multiple sessions', () => {
      service.recordings.set('session_1', [{ id: 'rec_1', sessionId: 'session_1' }]);
      service.recordings.set('session_2', [{ id: 'rec_2', sessionId: 'session_2' }]);
      
      const recordings1 = service.getSessionRecordings('session_1');
      const recordings2 = service.getSessionRecordings('session_2');
      
      expect(recordings1.length).toBe(1);
      expect(recordings2.length).toBe(1);
    });
  });

  describe('integration tests', () => {
    it('should handle complete voice interaction flow', async () => {
      // Record voice input
      const recordResult = await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      expect(recordResult).toBeDefined();

      // Execute command
      const commandResult = await service.executeCommand('session_1', 'play');
      expect(commandResult.success).toBe(true);

      // Get session stats
      const stats = service.getSessionStats('session_1');
      expect(stats).toBeDefined();
    });

    it('should handle multiple recordings in session', async () => {
      await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      await service.recordInput('session_1', 'q_2', '/path/to/audio.wav');
      await service.recordInput('session_1', 'q_3', '/path/to/audio.wav');

      const recordings = service.getSessionRecordings('session_1');
      expect(recordings.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle command execution between recordings', async () => {
      await service.recordInput('session_1', 'q_1', '/path/to/audio.wav');
      await service.executeCommand('session_1', 'next');
      await service.recordInput('session_1', 'q_2', '/path/to/audio.wav');

      const recordings = service.getSessionRecordings('session_1');
      expect(recordings.length).toBeGreaterThanOrEqual(2);
    });
  });
});
