# Smart Learn Project Structure

## Root Level
```
smart_learn/
├── backend/           # Backend API and services
├── frontend/          # Frontend application (TBD)
├── docs/            # Technical documentation, API specs
├── plan/            # TODO checklists and implementation breakdowns
├── req/             # Requirements, feature designs, architecture docs
├── package.json     # Root dependencies (papaparse, exceljs, etc.)
└── README.md        # Project overview
```

## Folder Purposes

### `plan/` - Implementation Checklists
Contains all TODO files and function-level breakdowns:
- `TODO.md` - Main project TODO with status tracking
- `TODO_DELIVERABLES_AND_CHECKPOINTS.md` - Detailed execution checklist
- `D3.2.1_CSV_EXCEL_FUNCTION_BREAKDOWN.md` - CSV/Excel implementation breakdown
- `D3.2.3_TRANSCRIPT_AUDIO_VIDEO_FUNCTION_BREAKDOWN.md` - Transcript implementation breakdown

### `req/` - Requirements & Design
Contains all requirements, feature designs, and architecture documents:
- `POSTGRESQL_SCHEMA_SPEC.md` - Database schema design
- `PRODUCT_FEATURE_ROADMAP.md` - Product roadmap and feature planning
- `TEACHING_PERSONALITY_AND_MOTIVATION_FRAMEWORK.md` - Teaching methodology
- `D3.2_FUTURE_INGESTION_FORMATS_DESIGN.md` - File format support design

### `docs/` - Technical Documentation
Contains technical documentation and API specs:
- API endpoint specifications
- System architecture diagrams
- Integration guides

### `backend/src/` - Backend Implementation
Contains all backend code:
- `src/ingestion/` - File parsing services (csv.js, excel.js, pptx.js, transcript.js)
- `src/api/` - REST API endpoints
- `src/db/` - Database operations

## Usage Guidelines

1. **For Planning**: Check `plan/` folder for current TODO items and their status
2. **For Requirements**: Read `req/` folder for feature designs and architecture decisions
3. **For Implementation**: Work in `backend/src/` based on breakdowns in `plan/`
4. **For Documentation**: Add technical docs to `docs/`

## Quick Reference

| Folder | Purpose | Contents |
|--------|---------|----------|
| `plan/` | TODO & Checklists | Implementation breakdowns, status tracking |
| `req/` | Requirements & Design | Feature specs, architecture docs |
| `docs/` | Technical Docs | API specs, system diagrams |
| `backend/` | Backend Code | Services, APIs, database |
