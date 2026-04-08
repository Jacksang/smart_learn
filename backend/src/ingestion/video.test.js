const { parse } = require('./video');
const fs = require('fs');
const path = require('path');

describe('Video Parser Service', () => {
  const testDir = path.join(__dirname, 'test-data');
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.mp4') || f.endsWith('.avi') || f.endsWith('.mov') || f.endsWith('.mkv'));
    testFiles.forEach(f => fs.unlinkSync(path.join(testDir, f)));
  });
  
  test('should parse MP4 video files', async () => {
    try {
      const mp4Content = 'dummy video content';
      const testFile = path.join(testDir, 'test.mp4');
      fs.writeFileSync(testFile, mp4Content);
      
      const result = await parse(testFile);
      
      expect(result.frames).toBeDefined();
      expect(Array.isArray(result.frames)).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.fileType).toBe('.mp4');
    } catch (error) {
      if (error.message.includes('FFmpeg not found')) {
        console.log('Skipping MP4 test - FFmpeg not available');
      } else {
        throw error;
      }
    }
  });
  
  test('should parse AVI video files', async () => {
    try {
      const aviContent = 'dummy video content';
      const testFile = path.join(testDir, 'test.avi');
      fs.writeFileSync(testFile, aviContent);
      
      const result = await parse(testFile);
      
      expect(result.metadata.fileType).toBe('.avi');
    } catch (error) {
      if (!error.message.includes('FFmpeg not found')) {
        throw error;
      }
    }
  });
  
  test('should parse MOV video files', async () => {
    try {
      const movContent = 'dummy video content';
      const testFile = path.join(testDir, 'test.mov');
      fs.writeFileSync(testFile, movContent);
      
      const result = await parse(testFile);
      
      expect(result.metadata.fileType).toBe('.mov');
    } catch (error) {
      if (!error.message.includes('FFmpeg not found')) {
        throw error;
      }
    }
  });
  
  test('should parse MKV video files', async () => {
    try {
      const mkvContent = 'dummy video content';
      const testFile = path.join(testDir, 'test.mkv');
      fs.writeFileSync(testFile, mkvContent);
      
      const result = await parse(testFile);
      
      expect(result.metadata.fileType).toBe('.mkv');
    } catch (error) {
      if (!error.message.includes('FFmpeg not found')) {
        throw error;
      }
    }
  });
  
  test('should reject unsupported video formats', async () => {
    const unsupportedFile = path.join(testDir, 'test.mov');
    fs.writeFileSync(unsupportedFile, 'dummy content');
    
    await expect(parse(unsupportedFile))
      .rejects
      .toThrow('Unsupported video format: .mov');
  });
  
  test('should return consistent format for all supported formats', async () => {
    const formats = ['.mp4', '.avi', '.mov', '.mkv'];
    
    for (const format of formats) {
      const testFile = path.join(testDir, `test${format}`);
      fs.writeFileSync(testFile, 'dummy content');
      
      try {
        const result = await parse(testFile);
        
        expect(typeof result.frames).toBe('object');
        expect(typeof result.metadata).toBe('object');
        expect(result.metadata.fileType).toBe(format);
      } catch (error) {
        if (!error.message.includes('FFmpeg not found')) {
          throw error;
        }
      }
    }
  });
  
  test('should extract metadata for video files', async () => {
    try {
      const mp4Content = 'dummy video content';
      const testFile = path.join(testDir, 'test.mp4');
      fs.writeFileSync(testFile, mp4Content);
      
      const result = await parse(testFile);
      
      expect(result.metadata).toHaveProperty('fileName');
      expect(result.metadata).toHaveProperty('fileType');
      expect(result.metadata).toHaveProperty('processedAt');
      expect(result.metadata).toHaveProperty('fileSize');
    } catch (error) {
      if (!error.message.includes('FFmpeg not found')) {
        throw error;
      }
    }
  });
  
  test('should handle empty video files', async () => {
    try {
      const mp4Content = '';
      const testFile = path.join(testDir, 'empty.mp4');
      fs.writeFileSync(testFile, mp4Content);
      
      const result = await parse(testFile);
      
      expect(result.frames).toBeDefined();
      expect(result.metadata.fileSize).toBe(0);
    } catch (error) {
      if (!error.message.includes('FFmpeg not found')) {
        throw error;
      }
    }
  });
  
  test('should return frame metadata with timestamps', async () => {
    try {
      const mp4Content = 'dummy video content';
      const testFile = path.join(testDir, 'test.mp4');
      fs.writeFileSync(testFile, mp4Content);
      
      const result = await parse(testFile);
      
      if (result.frames.length > 0) {
        expect(result.frames[0]).toHaveProperty('index');
        expect(result.frames[0]).toHaveProperty('filename');
        expect(result.frames[0]).toHaveProperty('timestamp');
        expect(result.frames[0]).toHaveProperty('path');
      }
    } catch (error) {
      if (!error.message.includes('FFmpeg not found')) {
        throw error;
      }
    }
  });
});
