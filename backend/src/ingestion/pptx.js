const PptxReader = require('pptxgenjs');
const fs = require('fs');

/**
 * Parse PowerPoint files (.pptx) and extract text with metadata
 * @param {string} filePath - Path to the PPTX file
 * @returns {Promise<{text: string, metadata: object}>} - Parsed text and metadata
 */
async function parse(filePath) {
  const pptx = new PptxReader();
  
  // Read the presentation file
  await pptx.load(filePath);
  
  let text = '';
  const slideMetadata = [];
  
  // Iterate through slides
  for (let i = 0; i < pptx.slideCount; i++) {
    const slide = pptx.slides[i];
    const slideText = [];
    
    // Extract text from shapes
    for (const shape of slide.shapes) {
      if (shape.text) {
        const textContent = typeof shape.text === 'string' 
          ? shape.text 
          : JSON.stringify(shape.text);
        slideText.push(textContent);
      }
    }
    
    const slideContent = slideText.join('\n\n');
    text += `Slide ${i + 1}: ${slide.title || 'Untitled'}\n${slideContent}\n\n`;
    
    slideMetadata.push({
      number: i + 1,
      title: slide.title || 'Untitled',
      shapeCount: slide.shapes.length,
      textLength: slideContent.length
    });
  }
  
  return { 
    text, 
    metadata: { 
      slides: slideMetadata,
      slideCount: pptx.slideCount,
      fileType: 'pptx'
    } 
  };
}

module.exports = { parse };
