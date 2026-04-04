# Smart Learn File Ingestion Strategy

## Status
Completed checkpoints in this document:
- Define MVP support for text / PDF / DOCX / image OCR

Remaining checkpoints will extend this document with extraction pipeline expectations, metadata storage rules, and final delivery notes.

---

## Purpose
This document defines how Smart Learn should accept, extract, normalize, and store learning materials during the MVP.

The goal is to support the most useful real-world study inputs without overbuilding the first backend version.

---

## MVP scope summary
Smart Learn MVP should support four user-provided input categories:
- plain text
- PDF
- DOCX
- image uploads through OCR

It should also support one non-user-upload fallback source:
- AI-generated base knowledge when user material is missing or too thin

This strategy is intentionally text-centric. Every supported format should end in normalized extracted text plus enough metadata to explain where that text came from.

---

## Supported MVP formats

### 1. Plain text
Includes:
- pasted text from the UI
- `.txt`
- markdown-like text content if treated as plain text in MVP

Why it is in MVP:
- cheapest and most reliable input path
- no extraction ambiguity
- best fallback when file parsing fails

MVP expectations:
- accept direct text creation without upload
- preserve original title if the user provides one
- store normalized extracted text immediately
- allow large enough payloads for practical study notes, with server-side limits

### 2. PDF
Includes:
- digitally generated PDFs
- text-selectable PDFs
- scanned PDFs only when OCR path is available

Why it is in MVP:
- common format for course notes, papers, textbooks, and exported slides

MVP expectations:
- support text extraction from text-based PDFs by default
- detect scanned or image-only PDFs and route to OCR when practical
- if OCR is unavailable or low-confidence, mark extraction as partial or failed instead of pretending success
- preserve page-level metadata when feasible, but do not block MVP on perfect layout reconstruction

### 3. DOCX
Includes:
- Microsoft Word `.docx` documents
- similar OOXML documents treated through DOCX extraction tooling

Why it is in MVP:
- common format for class notes, study guides, and shared handouts

MVP expectations:
- extract paragraph text in reading order
- flatten styling into plain text for first release
- ignore advanced layout fidelity such as floating images, comments, tracked changes, or embedded charts unless they can be represented safely as plain text notes

### 4. Image uploads via OCR
Includes:
- `.png`, `.jpg`, `.jpeg`, `.webp` if upload stack permits
- photographed notes, whiteboards, worksheets, or scanned pages

Why it is in MVP:
- many learners study from photos instead of formal documents
- covers scanned documents when PDF text extraction is not enough

MVP expectations:
- run OCR to produce extracted text
- keep the original image reference for traceability
- mark OCR confidence or extraction quality where available
- treat OCR output as noisier than text/PDF/DOCX and make downstream generation robust to imperfect extraction

---

## Format support policy

| Format | MVP support level | Default outcome |
|---|---|---|
| Pasted text | Full | Immediate normalized text |
| TXT | Full | Immediate normalized text |
| PDF (text-based) | Full | Parsed text + file metadata |
| PDF (scanned) | Partial/full depending on OCR availability | OCR text or extraction-failed state |
| DOCX | Full | Parsed text + file metadata |
| Image | Full if OCR pipeline is configured | OCR text + confidence metadata |
| Base knowledge | Full fallback | System-generated material record |

---

## Non-goals for MVP
The MVP should **not** try to fully solve:
- perfect preservation of document structure
- tables, charts, formulas, or slide layouts as first-class knowledge objects
- handwriting-specialized OCR tuning beyond a reasonable generic path
- semantic chunking optimized for every document type
- Excel/CSV, PPT/slides, URLs, audio, or video transcript ingestion

Those belong in later ingestion phases.

---

## Product rules connected to ingestion
- User-uploaded materials should receive higher default weight than system-generated base knowledge.
- If the user provides no usable material, the system may create base knowledge so learning can still begin.
- Outline generation should run on normalized text content, not directly on raw files.
- Material changes should be able to trigger outline refresh decisions.
- Failed extraction should be visible to the learner and the system, not silently ignored.

---

## Recommended first-release acceptance rules
- Reject unsupported file types clearly and early.
- Apply file-size limits to protect the service.
- Prefer deterministic extraction over clever but unstable parsing.
- If extraction produces too little text, mark the material as needing retry, OCR, or manual review.
- Allow the user to proceed with mixed materials even if one upload fails.

---

## Architecture direction
MVP ingestion should be modeled as a two-stage flow:
1. file acceptance and storage
2. text extraction and normalization

This keeps upload reliability separate from parser reliability and makes retries easier.

Later checkpoints in this document will define:
- extraction pipeline expectations
- metadata storage rules
- artifact completion details
