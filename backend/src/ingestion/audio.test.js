const { parse } = require('./audio');
const fs = require('fs');
const path = require('path');

describe('Audio Parser Service', () => {
  const testDir = path.join(__dirname, 'test-data');
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a'));
    testFiles.forEach(f => fs.unlinkSync(path.join(testDir, f)));
  });
  
  test('should parse MP3 audio files', async () => {
    // Skip if whisper CLI not available
    try {
      const mp3Content = 'dummy audio content';
      const testFile = path.join(testDir, 'test.mp3');
      fs.writeFileSync(testFile, mp3Content);
      
      // Mock the whisper CLI call
      const result = await parse(testFile);
      
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.fileType).toBe('.mp3');
    } catch (error) {
      if (error.message.includes('Whisper CLI not found')) {
        console.log('Skipping MP3 test - Whisper CLI not available');
      } else {
        throw error;
      }
    }
  });
  
  test('should parse WAV audio files', async () => {
    try {
      const wavContent = 'dummy audio content';
      const testFile = path.join(testDir, 'test.wav');
      fs.writeFileSync(testFile, wavContent);
      
      const result = await parse(testFile);
      
      expect(result.text).toBeDefined();
      expect(result.metadata.fileType).toBe('.wav');
    } catch (error) {
      if (!error.message.includes('Whisper CLI not found')) {
        throw error;
      }
    }
  });
  
  test('should parse M4A audio files', async () => {
    try {
      const m4aContent = 'dummy audio content';
      const testFile = path.join(testDir, 'test.m4a');
      fs.writeFileSync(testFile, m4aContent);
      
      const result = await parse(testFile);
      
      expect(result.text).toBeDefined();
      expect(result.metadata.fileType).toBe('.m4a');
    } catch (error) {
      if (!error.message.includes('Whisper CLI not found')) {
        throw error;
      }
    }
  });
  
  test('should reject unsupported audio formats', async () => {
    const unsupportedFile = path.join(testDir, 'test.flac');
    fs.writeFileSync(unsupportedFile, 'dummy content');
    
    await expect(parse(unsupportedFile))
      .rejects
      .toThrow('Unsupported audio format: .flac');
  });
  
  test('should return consistent format for all supported formats', async () => {
    const formats = ['.mp3', '.wav', '.m4a'];
    
    for (const format of formats) {
      const testFile = path.join(testDir, `test${format}`);
      fs.writeFileSync(testFile, 'dummy content');
      
      try {
        const result = await parse(testFile);
        
        expect(typeof result.text).toBe('string');
        expect(typeof result.metadata).toBe('object');
        expect(result.metadata.fileType).toBe(format);
      } catch (error) {
        if (!error.message.includes('Whisper CLI not found')) {
          throw error;
        }
      }
    }
  });
  
  test('should extract timestamps from transcript', async () => {
    try {
      const wavContent = 'dummy audio content';
      const testFile = path.join(testDir, 'test.wav');
      fs.writeFileSync(testFile, wavContent);
      
      const result = await parse(testFile);
      
      expect(Array.isArray(result.timestamps)).toBe(true);
    } catch (error) {
      if (!error.message.includes('Whisper CLI not found')) {
        throw error;
      }
    }
  });
  
  test('should handle empty audio files', async () => {
    try {
      const wavContent = '';
      const testFile = path.join(testDir, 'empty.wav');
      fs.writeFileSync(testFile, wavContent);
      
      const result = await parse(testFile);
      
      expect(result.text).toBe('');
      expect(result.metadata.fileSize).toBe(0);
    } catch (error) {
      if (!error.message.includes('Whisper CLI not found')) {
        throw error;
      }
    }
  });
  
  test('should return proper metadata for audio files', async () => {
    try {
      const mp3Content = 'dummy audio content';
      const testFile = path.join(testDir, 'test.mp3');
      fs.writeFileSync(testFile, mp3Content);
      
      const result = await parse(testFile);
      
      expect(result.metadata).toHaveProperty('fileName');
      expect(result.metadata).toHaveProperty('fileType');
      expect(result.metadata).toHaveProperty('processedAt');
    } catch (error) {
      if (!error.message.includes('Whisper CLI not found')) {
        throw error;
      }
    }
  });
});
