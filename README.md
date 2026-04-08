# Smart Learn AI

An AI-powered learning companion for students that provides personalized teaching, progress tracking, and adaptive learning materials.

## Overview

Smart Learn helps students learn more effectively by:
- Analyzing uploaded study materials (PDF, DOCX, CSV, Excel, PPTX, transcripts)
- Creating personalized study outlines and quizzes
- Tracking progress and identifying weak areas
- Providing encouraging, adaptive teaching feedback

## Project Status

### ✅ Completed Features (D3.2)
- **File Ingestion Support**: PDF, DOCX, images, CSV/Excel, PPT/slides, transcripts
- **Text Extraction**: Multi-format support with metadata tracking
- **Parser Services**: csv.js, excel.js, pptx.js, transcript.js

### 🚧 In Progress
- **Motivation Engine**: Weak-area detection, progress scoring
- **Review System**: Spaced repetition planning

### 📋 Planned Features
- Audio lesson narration
- Concept cards
- Visual concept maps
- Voice interaction

## Project Structure

```
smart_learn/
├── backend/           # Backend API and services
├── frontend/          # Frontend application (TBD)
├── docs/            # Technical documentation, API specs
├── plan/            # TODO checklists and implementation breakdowns
├── req/             # Requirements, feature designs, architecture docs
├── package.json     # Root dependencies
└── README.md        # This file
```

### Folder Purposes

- **`plan/`**: TODO checklists and function-level breakdowns for implementation
- **`req/`**: Requirements, feature designs, architecture documentation
- **`docs/`**: Technical documentation and API specifications
- **`backend/src/`**: Backend implementation (services, APIs, database)

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

## Development Workflow

1. Check `plan/` folder for current TODO items
2. Read relevant design docs in `req/` folder
3. Implement features based on function breakdowns
4. Commit and push to GitHub after each feature

## Documentation

- [Product Feature Roadmap](req/PRODUCT_FEATURE_ROADMAP.md)
- [Teaching Personality Framework](req/TEACHING_PERSONALITY_AND_MOTIVATION_FRAMEWORK.md)
- [PostgreSQL Schema Spec](req/POSTGRESQL_SCHEMA_SPEC.md)
- [Future Ingestion Formats Design](req/D3.2_FUTURE_INGESTION_FORMATS_DESIGN.md)

## License

Private - Smart Learn Project
