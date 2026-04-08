# Project Structure Update - Documentation Consolidation

## Purpose
This document tracks the consolidation of Smart Learn project documentation into a cleaner, more maintainable structure.

---

## Changes Made (2026-04-08)

### 1. README.md Consolidation
- **Before:** Separate README.md and PROJECT_STRUCTURE.md files
- **After:** Single concise README.md with links to detailed documentation
- **Location:** `README.md` (root)

### 2. Documentation Folder Organization
- **`/plan/`** - Implementation checklists and progress tracking
  - `progress.md` - Consolidated TODO file (replaces TODO.md + TODO_DELIVERABLES_AND_CHECKPOINTS.md)
  - `D*.md` - Function-level breakdowns for specific tasks
  
- **`/req/`** - Requirements and design documents
  - `PRODUCT_REQUIREMENTS.md` - Product requirements
  - `POSTGRESQL_SCHEMA_SPEC.md` - Database schema design
  - `PRODUCT_FEATURE_ROADMAP.md` - Feature roadmap
  - `TEACHING_PERSONALITY_AND_MOTIVATION_FRAMEWORK.md` - Teaching methodology
  - `D3.2_FUTURE_INGESTION_FORMATS_DESIGN.md` - File format support design

- **`/docs/`** - Technical documentation and API specs
  - API endpoint specifications
  - System architecture diagrams
  - Integration guides

### 3. TODO File Consolidation
- **Before:** Two separate files (TODO.md + TODO_DELIVERABLES_AND_CHECKPOINTS.md)
- **After:** Single consolidated `progress.md` file
- **Status Annotations:**
  - `[ ]` Task to do
  - `[*]` Task is ongoing
  - `[x]` Task is done
  - `[~]` Task is obsoleted or bypassed

---

## Usage Guidelines

### For Planning
- Check `plan/` folder for current TODO items and their status
- Use `progress.md` as the main progress tracker
- Reference function-level breakdowns for detailed implementation tasks

### For Requirements
- Read `req/` folder for feature designs and architecture decisions
- Create new requirement documents when starting new features

### For Implementation
- Work in `backend/src/` based on breakdowns in `plan/`
- Follow function-level breakdowns for coding tasks

### For Documentation
- Add technical docs to `docs/` folder
- Keep README.md concise and up-to-date

---

## Quick Reference

| Folder | Purpose | Contents |
|--------|---------|----------|
| `plan/` | TODO & Checklists | Progress tracking, implementation breakdowns |
| `req/` | Requirements & Design | Feature specs, architecture docs |
| `docs/` | Technical Docs | API specs, system diagrams |
| `backend/` | Backend Code | Services, APIs, database |

---

**Last Updated:** 2026-04-08  
**Status:** Active development
