const { parse } = require('./pptx');
const fs = require('fs');
const path = require('path');

describe('PPTX Parser Service', () => {
  const testDir = path.join(__dirname, 'test-data');
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.pptx'));
    testFiles.forEach(f => fs.unlinkSync(path.join(testDir, f)));
  });
  
  test('should parse basic PPTX file', async () => {
    const pptx = new (require('pptxgenjs'))();
    pptx.addSlide().addText('Hello World');
    
    const testFile = path.join(testDir, 'basic.pptx');
    await pptx.writeFile({ fileName: testFile });
    
    const result = await parse(testFile);
    
    expect(result.text).toContain('Hello World');
    expect(result.metadata.slideCount).toBe(1);
  });
  
  test('should parse multi-slide presentation', async () => {
    const pptx = new (require('pptxgenjs'))();
    
    pptx.addSlide().addText('Slide 1 Content');
    pptx.addSlide().addText('Slide 2 Content');
    pptx.addSlide().addText('Slide 3 Content');
    
    const testFile = path.join(testDir, 'multi_slide.pptx');
    await pptx.writeFile({ fileName: testFile });
    
    const result = await parse(testFile);
    
    expect(result.metadata.slideCount).toBe(3);
    expect(result.text).toContain('Slide 1');
    expect(result.text).toContain('Slide 2');
    expect(result.text).toContain('Slide 3');
  });
  
  test('should handle empty slides', async () => {
    const pptx = new (require('pptxgenjs'))();
    pptx.addSlide(); // Empty slide
    
    const testFile = path.join(testDir, 'empty.pptx');
    await pptx.writeFile({ fileName: testFile });
    
    const result = await parse(testFile);
    
    expect(result.metadata.slideCount).toBe(1);
    expect(result.metadata.slides[0].textLength).toBe(0);
  });
  
  test('should return consistent format', async () => {
    const pptx = new (require('pptxgenjs'))();
    pptx.addSlide().addText('Test');
    
    const testFile = path.join(testDir, 'format.pptx');
    await pptx.writeFile({ fileName: testFile });
    
    const result = await parse(testFile);
    
    expect(typeof result.text).toBe('string');
    expect(typeof result.metadata).toBe('object');
    expect(Array.isArray(result.metadata.slides)).toBe(true);
  });
});
