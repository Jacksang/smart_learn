const { parse } = require('./transcript');
const fs = require('fs');
const path = require('path');

describe('Transcript Parser Service', () => {
  const testDir = path.join(__dirname, 'test-data');
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.srt') || f.endsWith('.vtt') || f.endsWith('.txt'));
    testFiles.forEach(f => fs.unlinkSync(path.join(testDir, f)));
  });
  
  test('should parse SRT subtitle file', async () => {
    const srtContent = `1
00:00:01,000 --> 00:00:04,000
Hello World

2
00:00:05,000 --> 00:00:08,000
This is a test`;
    
    const testFile = path.join(testDir, 'test.srt');
    fs.writeFileSync(testFile, srtContent);
    
    const result = await parse(testFile);
    
    expect(result.text).toContain('Hello World');
    expect(result.text).toContain('This is a test');
    expect(result.metadata.subtitleCount).toBe(2);
    expect(result.timestamps.length).toBe(2);
  });
  
  test('should parse VTT subtitle file', async () => {
    const vttContent = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello VTT

2
00:00:05.000 --> 00:00:08.000
This is VTT test`;
    
    const testFile = path.join(testDir, 'test.vtt');
    fs.writeFileSync(testFile, vttContent);
    
    const result = await parse(testFile);
    
    expect(result.text).toContain('Hello VTT');
    expect(result.metadata.subtitleCount).toBe(2);
  });
  
  test('should parse plain text file', async () => {
    const txtContent = 'This is a plain text transcript';
    
    const testFile = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFile, txtContent);
    
    const result = await parse(testFile);
    
    expect(result.text).toBe(txtContent);
    expect(result.metadata.textLength).toBe(txtContent.length);
    expect(result.timestamps).toHaveLength(0);
  });
  
  test('should handle empty subtitles', async () => {
    const srtContent = `1
00:00:01,000 --> 00:00:04,000

2
00:00:05,000 --> 00:00:08,000
Test`;
    
    const testFile = path.join(testDir, 'empty.srt');
    fs.writeFileSync(testFile, srtContent);
    
    const result = await parse(testFile);
    
    expect(result.metadata.subtitleCount).toBe(2);
  });
  
  test('should return consistent format', async () => {
    const txtContent = 'Test';
    
    const testFile = path.join(testDir, 'format.txt');
    fs.writeFileSync(testFile, txtContent);
    
    const result = await parse(testFile);
    
    expect(typeof result.text).toBe('string');
    expect(typeof result.metadata).toBe('object');
    expect(Array.isArray(result.timestamps)).toBe(true);
  });
  
  test('should throw error for unsupported format', async () => {
    const testFile = path.join(testDir, 'test.xyz');
    fs.writeFileSync(testFile, 'content');
    
    await expect(parse(testFile)).rejects.toThrow('Unsupported transcript format: xyz');
  });
});
