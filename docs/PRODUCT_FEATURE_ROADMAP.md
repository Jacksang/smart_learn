# Smart Learn Product Feature Roadmap

## Product Direction Summary
Smart Learn is an AI-supported learning coach focused on:
- structured learning
- quiz-based reinforcement
- progress tracking
- motivation protection
- weighted knowledge sources
- gentle tutoring with focus control

## Confirmed Product Rules
- If the user has no uploaded material, system should provide AI-generated base knowledge
- User-uploaded materials should have higher weight by default than system/base knowledge
- Users can manually reduce material weight
- Outline should update when source materials change
- Quiz generation defaults to 5 questions per batch
- Additional quiz questions should be created batch-by-batch on request
- Students may ask extra questions during teaching
- Off-track or too-deep questions should be recorded for later and the student guided back to the current lesson unless they explicitly choose to switch
- MVP should support multimedia input in phases

## Input / Output Strategy
### MVP input formats
- pasted text
- PDF
- DOCX
- images via OCR
- AI-generated base knowledge when no upload exists

### Later input formats
- Excel / CSV
- PPT / slides
- URLs
- audio/video transcripts

### MVP output formats
- text lessons
- outlines
- quiz questions
- progress views
- feedback summaries

### Later output formats
- audio lesson narration
- concept cards
- visual concept maps
- voice interaction

## Learning Flow Blueprint
### Main flow
1. Create learning project
2. Add source materials or use AI base knowledge
3. Generate / update outline
4. Learn by topic in small chunks
5. Ask questions during lesson
6. Take 5-question quiz batch
7. Review feedback and weak areas
8. Revisit deferred questions
9. Continue learning loop

### Key system loops
- material update loop -> refresh outline and future questions
- quiz loop -> answer, evaluate, reinforce
- struggle loop -> activate confidence recovery mode
- curiosity loop -> defer or revisit side questions

## Phase 0 — Planning & Architecture
Goal: freeze product direction and design foundation before heavy coding.

### Deliverables
- product requirements clarified
- teaching personality and motivation framework
- phased roadmap
- database schema design
- API surface design
- module boundaries defined

### Todo
- [x] Confirm MVP learning loop
- [x] Confirm source weighting rules
- [x] Confirm default quiz batch size = 5
- [x] Confirm deferred question behavior
- [x] Confirm motivation/encouragement direction
- [ ] Finalize PostgreSQL schema
- [ ] Finalize API endpoints
- [ ] Finalize file ingestion strategy by format

## Phase 1 — Backend MVP Foundation
Goal: working end-to-end backend with deterministic mock AI and PostgreSQL.

### Core capabilities
- user auth
- learning projects
- source materials
- AI-generated base knowledge fallback
- outline generation/update
- question generation
- answer submission
- progress tracking

### Backend todo
- [ ] Refactor persistence to PostgreSQL
- [ ] Create tables: users, learning_projects, source_materials, outlines, outline_items, questions, answer_attempts, progress_snapshots
- [ ] Consider deferred_questions table in initial schema or near-term follow-up
- [ ] Add migrations / schema bootstrap
- [ ] Normalize port to 3001
- [ ] Add API tests for core flows

### API todo
- [ ] POST /auth/register
- [ ] POST /auth/login
- [ ] POST /projects
- [ ] GET /projects/:id
- [ ] POST /projects/:id/materials
- [ ] PATCH /materials/:id/weight
- [ ] POST /projects/:id/base-knowledge/generate
- [ ] POST /projects/:id/outline/generate
- [ ] GET /projects/:id/outline
- [ ] POST /projects/:id/questions/generate
- [ ] GET /projects/:id/questions/current-batch
- [ ] POST /questions/:id/answer
- [ ] GET /projects/:id/progress

## Phase 2 — Guided Learning Experience
Goal: turn backend capabilities into a coherent tutor flow.

### Features
- topic-by-topic learning mode
- short lesson chunks
- summary and key-points generation
- inline student questions
- deferred question queue
- gentle redirection to current lesson

### Todo
- [ ] Define lesson-step model/state
- [ ] Add learn session tracking
- [ ] Add deferred questions storage and retrieval
- [ ] Add “answer now vs defer” logic
- [ ] Add revisit saved questions flow
- [ ] Add session summaries

## Phase 3 — Motivation & Confidence Engine
Goal: inject the emotional core of the product.

### Features
- encouraging feedback templates
- process-based praise
- confidence recovery mode
- micro-win celebrations
- constructive progress labels
- end-of-session encouragement summary

### Todo
- [ ] Create feedback template library
- [ ] Define struggle signals and thresholds
- [ ] Add confidence recovery path
- [ ] Add easy-question fallback logic
- [ ] Add resilience / focus / effort badges or milestones
- [ ] Add non-shaming progress states

## Phase 4 — File & Multimedia Expansion
Goal: broaden real-world learning material support.

### Priority support
- [ ] PDF extraction
- [ ] DOCX extraction
- [ ] OCR for image uploads
- [ ] Store extracted text + file metadata

### Later support
- [ ] Excel/CSV ingestion
- [ ] PPT/slides ingestion
- [ ] URL import
- [ ] transcript import for video/audio

## Phase 5 — Progress Intelligence
Goal: make learning more adaptive and measurable.

### Features
- weak area identification
- per-topic progress
- review recommendations
- spaced review planning
- improvement trends

### Todo
- [ ] topic mastery calculation
- [ ] weak area scoring
- [ ] review recommendation rules
- [ ] progress snapshots/history
- [ ] learning dashboard summaries

## Phase 6 — Richer Student Experience
Goal: improve retention and delight once core learning loop works.

### Features
- audio explanations
- narrated review mode
- concept cards
- simple visuals / concept maps
- personalized tone settings

### Todo
- [ ] audio output strategy
- [ ] visual summary generation strategy
- [ ] tone profile settings
- [ ] voice / multimodal UX experiments

## Phase 7 — Growth / Platform Extensions
Only after core product value is proven.

### Possible features
- parent/teacher view
- classroom/team mode
- social encouragement
- advanced analytics
- real LLM integration beyond mock AI

### Todo
- [ ] teacher reporting concepts
- [ ] collaboration model
- [ ] notification strategy
- [ ] production AI provider abstraction

## Suggested Priority Order for Actual Development
1. Finalize schema + API design
2. Refactor backend to PostgreSQL
3. Implement projects/materials/outlines
4. Add base knowledge fallback
5. Add question batch generation
6. Add answers + progress tracking
7. Add deferred question queue
8. Add motivation/feedback layer
9. Add file extraction pipeline
10. Add richer multimedia outputs

## Immediate Next Planning Documents To Produce
- database schema spec
- API endpoint spec
- lesson state machine
- deferred question model
- feedback template catalog

## Release Logic
### MVP release criteria
- student can create project
- student can study with uploaded or system-generated material
- system can generate/update outline
- system can generate 5-question quiz batches
- system records answers and shows progress
- system can encourage and redirect without shaming

### Beta release criteria
- deferred question queue works
- confidence recovery mode works
- PDF/DOCX/image ingestion works
- progress recommendations feel useful

### V1 release criteria
- multimedia outputs begin
- richer personalization exists
- adaptive learning flow feels tutor-like and sticky
