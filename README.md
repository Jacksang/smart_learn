# Smart Learn AI

An AI-powered learning companion for students that provides personalized teaching, progress tracking, and adaptive learning materials.

## Overview

Smart Learn helps students learn more effectively by:
- Analyzing uploaded study materials (PDF, DOCX, CSV, Excel, PPTX, transcripts)
- Creating personalized study outlines and quizzes
- Tracking progress and identifying weak areas
- Providing encouraging, adaptive teaching feedback

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

```bash
cd backend
npm install
npm run dev
```

### Supported File Formats
- **Text**: TXT, CSV
- **Documents**: PDF, DOCX
- **Spreadsheets**: Excel (.xlsx, .xls), CSV
- **Presentations**: PowerPoint (.pptx)
- **Subtitles/Transcripts**: SRT, VTT

## Project Status

### ✅ Completed (D3.2 - Future Ingestion Formats)
- PDF, DOCX text extraction with metadata
- Image handling and OCR support
- CSV/Excel parsing (csv.js, excel.js)
- PPT/slides parsing (pptx.js)
- Transcript/subtitle parsing (SRT, VTT, TXT)

### 🚧 In Progress
- Motivation Engine: Weak-area detection, progress scoring
- Review System: Spaced repetition planning

### 📋 Planned Features
- Audio lesson narration
- Concept cards
- Visual concept maps
- Voice interaction

## Documentation

For detailed project information:
- **Requirements & Design**: See [`req/`](./req/) folder
- **Implementation Plans**: See [`plan/`](./plan/) folder  
- **Technical Specs**: See [`docs/`](./docs/) folder
- **Project Structure**: See [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)

## Development Workflow

1. Check `plan/` folder for current TODO items and status
2. Read relevant design docs in `req/` folder
3. Implement features based on function breakdowns
4. Commit and push to GitHub after each feature

## License

Private - Smart Learn Project

---

**Last Updated**: 2026-04-08  
**Status**: Active development
