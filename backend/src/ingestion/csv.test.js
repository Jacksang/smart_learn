const { parse } = require('./csv');
const fs = require('fs');
const path = require('path');

describe('CSV Parser Service', () => {
  const testDir = path.join(__dirname, 'test-data');
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.csv'));
    testFiles.forEach(f => fs.unlinkSync(path.join(testDir, f)));
  });
  
  test('should parse basic CSV file', async () => {
    const csvContent = 'Name,Description,Value\nItem 1,Simple item,100\nItem 2,Another item,200';
    const testFile = path.join(testDir, 'basic.csv');
    fs.writeFileSync(testFile, csvContent);
    
    const result = await parse(testFile);
    
    expect(result.text).toContain('Name: Item 1');
    expect(result.text).toContain('Value: 100');
    expect(result.metadata.rows).toBe(2);
    expect(result.metadata.columns).toBe(3);
  });
  
  test('should handle multi-line cells', async () => {
    const csvContent = 'Name,Description\nItem 1,"Line 1\nLine 2"\nItem 2,Simple';
    const testFile = path.join(testDir, 'multiline.csv');
    fs.writeFileSync(testFile, csvContent);
    
    const result = await parse(testFile);
    
    expect(result.metadata.rows).toBe(2);
    expect(result.text).toContain('Line 1');
  });
  
  test('should handle quoted values', async () => {
    const csvContent = 'Name,Description,Value\n"Item 1","A "quoted" item",100';
    const testFile = path.join(testDir, 'quoted.csv');
    fs.writeFileSync(testFile, csvContent);
    
    const result = await parse(testFile);
    
    expect(result.metadata.rows).toBe(1);
    expect(result.text).toContain('quoted');
  });
  
  test('should handle empty lines', async () => {
    const csvContent = 'Name,Value\n\nItem 1,100\n\nItem 2,200';
    const testFile = path.join(testDir, 'empty.csv');
    fs.writeFileSync(testFile, csvContent);
    
    const result = await parse(testFile);
    
    expect(result.metadata.rows).toBe(2);
  });
  
  test('should return consistent format', async () => {
    const csvContent = 'A,B,C\n1,2,3';
    const testFile = path.join(testDir, 'format.csv');
    fs.writeFileSync(testFile, csvContent);
    
    const result = await parse(testFile);
    
    expect(typeof result.text).toBe('string');
    expect(typeof result.metadata).toBe('object');
    expect(result.metadata.rows).toBeDefined();
    expect(result.metadata.columns).toBeDefined();
  });
});
