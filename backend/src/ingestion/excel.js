const ExcelJS = require('exceljs');
const fs = require('fs');

/**
 * Parse Excel files (.xlsx/.xls) and extract text with metadata
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<{text: string, metadata: object}>} - Parsed text and metadata
 */
async function parse(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  let text = '';
  const sheetMetadata = [];
  
  for (const sheet of workbook.worksheets) {
    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = sheet.getRow(1).getCell(colNumber).value;
        rowData[header] = cell.value;
      });
      
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    });
    
    text += `Sheet: ${sheet.name}\n${JSON.stringify(rows, null, 2)}\n\n`;
    sheetMetadata.push({
      name: sheet.name,
      rowCount: sheet.rowCount - 1, // Exclude header
      columnCount: sheet.columnCount
    });
  }
  
  return { text, metadata: { sheets: sheetMetadata } };
}

module.exports = { parse };
