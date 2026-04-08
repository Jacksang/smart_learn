const { parse } = require('./excel');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

describe('Excel Parser Service', () => {
  const testDir = path.join(__dirname, 'test-data');
  
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.xlsx'));
    testFiles.forEach(f => fs.unlinkSync(path.join(testDir, f)));
  });
  
  test('should parse single sheet Excel file', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TestSheet');
    
    sheet.addRow(['Name', 'Value']);
    sheet.addRow(['Item 1', 100]);
    sheet.addRow(['Item 2', 200]);
    
    const testFile = path.join(testDir, 'single_sheet.xlsx');
    await workbook.xlsx.writeFile(testFile);
    
    const result = await parse(testFile);
    
    expect(result.text).toContain('TestSheet');
    expect(result.metadata.sheets).toHaveLength(1);
    expect(result.metadata.sheets[0].rowCount).toBe(2);
  });
  
  test('should parse multi-sheet Excel file', async () => {
    const workbook = new ExcelJS.Workbook();
    
    const sheet1 = workbook.addWorksheet('Sheet1');
    sheet1.addRow(['A', 'B']);
    sheet1.addRow([1, 2]);
    
    const sheet2 = workbook.addWorksheet('Sheet2');
    sheet2.addRow(['X', 'Y']);
    sheet2.addRow([3, 4]);
    
    const testFile = path.join(testDir, 'multi_sheet.xlsx');
    await workbook.xlsx.writeFile(testFile);
    
    const result = await parse(testFile);
    
    expect(result.metadata.sheets).toHaveLength(2);
    expect(result.text).toContain('Sheet1');
    expect(result.text).toContain('Sheet2');
  });
  
  test('should handle empty sheets', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('EmptySheet');
    
    const testFile = path.join(testDir, 'empty_sheet.xlsx');
    await workbook.xlsx.writeFile(testFile);
    
    const result = await parse(testFile);
    
    expect(result.metadata.sheets[0].rowCount).toBe(0);
  });
  
  test('should return consistent format', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');
    sheet.addRow(['Header']);
    
    const testFile = path.join(testDir, 'format.xlsx');
    await workbook.xlsx.writeFile(testFile);
    
    const result = await parse(testFile);
    
    expect(typeof result.text).toBe('string');
    expect(typeof result.metadata).toBe('object');
    expect(Array.isArray(result.metadata.sheets)).toBe(true);
  });
});
