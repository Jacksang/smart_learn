# Smart Learn TODO

## Current Status
- [x] GitHub repo created: `Jacksang/smart_learn`
- [x] Backend scaffold exists in `backend/`
- [x] Product discussion updated with weighted materials, base knowledge fallback, deferred questions, and motivation-first tutoring
- [x] Teaching personality & motivation framework documented
- [x] Phased product roadmap documented

## P0 — Immediate Planning Tasks
- [ ] Finalize PostgreSQL schema
- [ ] Finalize API endpoint spec
- [ ] Define lesson state machine
- [ ] Define deferred question model
- [ ] Define file ingestion strategy for PDF / DOCX / images
- [ ] Update PRODUCT_REQUIREMENTS.md to match latest direction

## P1 — MVP Backend Foundation
- [ ] Refactor persistence from Mongo-style logic to PostgreSQL
- [ ] Add schema/bootstrap or migrations
- [ ] Standardize backend default port to `3001`
- [ ] Implement `learning_projects`
- [ ] Implement `source_materials`
- [ ] Implement AI-generated base knowledge fallback
- [ ] Implement outline generation and refresh flow
- [ ] Implement question generation with default batch size = 5
- [ ] Implement answer submission and evaluation
- [ ] Implement progress tracking
- [ ] Add API tests for auth + project + material + outline + question + answer flows

## P1 — Tutor Flow / Learning Experience
- [ ] Add topic-by-topic Learn mode
- [ ] Add Review mode
- [ ] Add Quiz mode
- [ ] Add Reinforce mode
- [ ] Add deferred question queue / parking lot
- [ ] Add answer-now vs defer logic during teaching
- [ ] Add end-of-session learning summary

## P1 — Motivation & Confidence Layer
- [ ] Add encouraging feedback templates
- [ ] Add process-based praise rules
- [ ] Add confidence recovery mode
- [ ] Add easier fallback question flow after repeated struggle
- [ ] Add constructive progress labels (`strong`, `improving`, `building`, `needs reinforcement`)
- [ ] Add resilience/focus/effort milestone logic

## P2 — File & Multimedia Input
- [x] Support pasted text
- [x] Support PDF extraction
- [x] Support DOCX extraction
- [x] Support image OCR
- [x] Store extracted text with file metadata and weights
- [x] Plan Excel/CSV support (design doc: `docs/D3.2_FUTURE_INGESTION_FORMATS_DESIGN.md`)
- [x] Plan PPT/slides support (design doc: `docs/D3.2_FUTURE_INGESTION_FORMATS_DESIGN.md`)
- [x] Plan transcript ingestion (design doc: `docs/D3.2_FUTURE_INGESTION_FORMATS_DESIGN.md`)
- [ ] Implement Excel/CSV support
- [ ] Implement PPT/slides support
- [ ] Implement transcript/audio/video support

## P2 — Progress Intelligence
- [ ] Weak-area detection
- [ ] Topic mastery scoring
- [ ] Progress snapshots/history
- [ ] Review recommendation engine
- [ ] Spaced-review planning

## P3 — Richer Experience Later
- [ ] Audio lesson narration
- [ ] Concept cards
- [ ] Visual concept maps
- [ ] Tone profiles for tutor personality
- [ ] Voice interaction
- [ ] Parent/teacher view

## Key Reference Docs
- `docs/TEACHING_PERSONALITY_AND_MOTIVATION_FRAMEWORK.md`
- `docs/PRODUCT_FEATURE_ROADMAP.md`
- `PRODUCT_REQUIREMENTS.md`

## Recommended Next Step
1. Database schema spec
2. API endpoint spec
3. Then coding against the finalized design
