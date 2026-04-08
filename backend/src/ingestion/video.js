const { execFile, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Parse video files using ffmpeg
 * @param {string} filePath - Path to the video file
 * @returns {Promise<{frames: object[], metadata: object}>} - Extracted frames and metadata
 */
async function parse(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const supportedFormats = ['.mp4', '.avi', '.mov', '.mkv'];
  
  if (!supportedFormats.includes(extension)) {
    throw new Error(`Unsupported video format: ${extension}. Supported formats: ${supportedFormats.join(', ')}`);
  }
  
  // Check if ffmpeg is available
  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    throw new Error('FFmpeg not found. Please install it to use video processing.');
  }
  
  // Create temporary directory for processing
  const tempDir = path.join(process.cwd(), 'tmp', 'video-processing');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const outputDir = path.join(tempDir, Date.now().toString());
  fs.mkdirSync(outputDir, { recursive: true });
  
  try {
    // Extract video metadata
    const metadata = extractVideoMetadata(filePath);
    
    // Extract keyframes from video
    const frames = await extractKeyframes(filePath, outputDir, metadata.duration);
    
    return {
      frames,
      metadata: {
        ...metadata,
        fileSize: fs.statSync(filePath).size,
        fileName: path.basename(filePath),
        fileType: extension,
        processedAt: new Date().toISOString()
      }
    };
  } finally {
    // Clean up temporary files
    cleanupDirectory(outputDir);
  }
}

/**
 * Check if FFmpeg is available
 */
async function checkFFmpeg() {
  return new Promise((resolve) => {
    execFile('ffmpeg', ['-version'], (error) => {
      resolve(error === null);
    });
  });
}

/**
 * Extract video metadata using ffprobe
 */
function extractVideoMetadata(filePath) {
  try {
    const duration = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=yes "${filePath}"`, { encoding: 'utf8' }).trim();
    
    const formatInfo = execSync(`ffprobe -v error -show_entries stream=width,height,codec_name -of compact=p=0 "${filePath}"`, { encoding: 'utf8' }).trim();
    
    const dimensionMatch = formatInfo.match(/width=(\d+)/);
    const heightMatch = formatInfo.match(/height=(\d+)/);
    const codecMatch = formatInfo.match(/codec_name=(\w+)/);
    
    const width = dimensionMatch ? parseInt(dimensionMatch[1], 10) : 0;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 0;
    const codec = codecMatch ? codecMatch[1] : 'unknown';
    
    return {
      duration: duration || 'unknown',
      width,
      height,
      codec,
      frameRate: extractFrameRate(filePath)
    };
  } catch (e) {
    return {
      duration: 'unknown',
      width: 0,
      height: 0,
      codec: 'unknown',
      frameRate: 'unknown'
    };
  }
}

/**
 * Extract frame rate from video
 */
function extractFrameRate(filePath) {
  try {
    const info = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=yes "${filePath}"`, { encoding: 'utf8' }).trim();
    if (!info || info === '0/1') return 'unknown';
    const [num, denom] = info.split('/');
    return (parseInt(num, 10) / parseInt(denom, 10)).toFixed(1);
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Extract keyframes from video
 * @param {string} inputPath - Path to input video
 * @param {string} outputDir - Output directory for frames
 * @param {string} duration - Video duration
 * @returns {Promise<object[]>} - Array of frame metadata
 */
async function extractKeyframes(inputPath, outputDir, duration) {
  const frames = [];
  const outputPattern = path.join(outputDir, 'frame_%04d.jpg');
  
  return new Promise((resolve, reject) => {
    // Extract one frame every 5 seconds, or more frequently for shorter videos
    let fps = '1/5'; // Default: 1 frame every 5 seconds
    
    if (duration && duration !== 'unknown') {
      const dur = parseFloat(duration);
      if (dur < 10) {
        fps = '1/2'; // 1 frame every 2 seconds for videos under 10s
      } else if (dur < 30) {
        fps = '1/5'; // 1 frame every 5 seconds for videos under 30s
      } else {
        fps = '1/10'; // 1 frame every 10 seconds for longer videos
      }
    }
    
    const args = [
      '-i', inputPath,
      '-vf', `fps=${fps}`,
      '-q:v', '2',
      '-max_muxing_queue_size', '1024',
      outputPattern
    ];
    
    execFile('ffmpeg', args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`FFmpeg error: ${stderr}`));
        return;
      }
      
      // List extracted frames
      const frameFiles = fs.readdirSync(outputDir)
        .filter(f => f.match(/^frame_\d{4}\.jpg$/))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0], 10);
          const numB = parseInt(b.match(/\d+/)[0], 10);
          return numA - numB;
        });
      
      // Extract metadata for each frame
      for (let i = 0; i < frameFiles.length; i++) {
        const frameFile = frameFiles[i];
        const framePath = path.join(outputDir, frameFile);
        const frameTime = (i * 5).toFixed(1); // Approximate timestamp
        
        frames.push({
          index: i + 1,
          filename: frameFile,
          timestamp: frameTime,
          path: path.relative(process.cwd(), framePath),
          size: fs.statSync(framePath).size
        });
      }
      
      resolve(frames);
    });
  });
}

/**
 * Clean up temporary directory
 */
function cleanupDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

module.exports = { parse };
