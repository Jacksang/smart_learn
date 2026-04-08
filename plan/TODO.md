# Smart Learn - Main TODO Overview

## Project Status

### ✅ Completed Features

1. **File Ingestion (D3.1)**
   - PDF, DOCX text extraction with metadata
   - Image handling and OCR support

2. **Future Ingestion Formats (D3.2)**
   - ✅ CSV/Excel support implemented
     - csv.js parser with unit tests
     - excel.js parser with unit tests
     - service.js routing updated
   - ✅ PPT/Slides support implemented
     - pptx.js parser with unit tests

### 🔄 In Progress

3. **Transcript/Audio/Video Support (D3.3)**
   - ⏳ Subtitle file parsing (.srt, .vtt)
   - ⏳ Audio transcription (Whisper CLI integration)
   - ⏳ Video frame extraction

### 📋 Planned Features

4. **Motivation Engine (D4)**
   - Weak-area detection
   - Progress scoring system
   - Spaced repetition planning

5. **Review System (D5)**
   - Flashcard generation
   - Concept mapping

6. **Audio Features (D6)**
   - Lesson narration
   - Voice interaction

## Implementation Checklists

For detailed implementation tasks and current status, see:

- **Main TODO**: [`plan/TODO.md`](./plan/TODO.md)
- **Detailed Checkpoints**: [`plan/TODO_DELIVERABLES_AND_CHECKPOINTS.md`](./plan/TODO_DELIVERABLES_AND_CHECKPOINTS.md)
- **CSV/Excel Breakdown**: [`plan/D3.2.1_CSV_EXCEL_FUNCTION_BREAKDOWN.md`](./plan/D3.2.1_CSV_EXCEL_FUNCTION_BREAKDOWN.md)
- **Transcript Breakdown**: [`plan/D3.2.3_TRANSCRIPT_AUDIO_VIDEO_FUNCTION_BREAKDOWN.md`](./plan/D3.2.3_TRANSCRIPT_AUDIO_VIDEO_FUNCTION_BREAKDOWN.md)

## Documentation

For requirements, feature designs, and architecture docs, see:

- **Requirements & Design**: [`req/`](./req/) folder
- **Technical Docs**: [`docs/`](./docs/) folder

## Quick Navigation

| Category | Files |
|----------|-------|
| **Implementation Plans** | `plan/` |
| **Requirements & Design** | `req/` |
| **Technical Documentation** | `docs/` |
| **Backend Services** | `backend/src/` |

## Next Steps

1. ✅ Complete D3.2 (Future ingestion formats)
   - CSV/Excel support implemented
   - PPT/slides support implemented
2. ⏳ Implement D3.3 (Transcript/Audio/Video support)
   - SRT/VTT subtitle parsing
   - Audio transcription with Whisper CLI
3. ⏳ Implement D4 (Motivation Engine)
   - Weak-area detection
   - Progress scoring system
4. ⏳ Build D5 (Review System with flashcards)

---

**Last Updated**: 2026-04-08  
**Status**: Active development
