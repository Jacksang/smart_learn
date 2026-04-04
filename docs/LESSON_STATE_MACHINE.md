# Smart Learn Lesson State Machine

## Status
Completed checkpoints in this document:
- Define Learn / Review / Quiz / Reinforce states

Remaining checkpoints will extend this document with transitions, interruption handling, deferred-question behavior, and final delivery notes.

---

## Purpose
This document defines the learner-facing session state model for Smart Learn.

The state machine should keep the lesson flow structured without feeling rigid. It should support forward progress, recovery from struggle, and graceful handling of side-questions and interruptions.

---

## Core session states

### 1. `learn`
Purpose:
- introduce or explain a topic for the first time
- build understanding before pressure-testing recall
- establish context, examples, and key concepts

Typical behaviors:
- explain topic in small steps
- ask light comprehension checks
- allow clarifying questions
- detect whether the learner is ready to continue or needs simplification

Entry conditions:
- learner starts a new topic
- learner resumes after outline selection with no prior mastery
- system chooses instruction before quiz pressure

Expected outputs:
- learner sees topic explanation
- key ideas are introduced
- learner can move into review or quiz when ready

### 2. `review`
Purpose:
- revisit previously covered material
- strengthen retrieval and connect earlier knowledge with current learning
- consolidate understanding after time has passed or after weak performance

Typical behaviors:
- summarize prior topic content
- ask short recall prompts
- compare current understanding to prior work
- revisit weak points in a lower-pressure way than full quiz mode

Entry conditions:
- learner returns to a prior topic
- system detects partial mastery or fading confidence
- session resumes after a break and refresh is needed

Expected outputs:
- understanding is refreshed
- weak points become clearer
- learner is prepared for quiz or reinforce flow

### 3. `quiz`
Purpose:
- evaluate understanding with structured questions
- generate correctness signals, explanations, and progress updates
- identify strong areas and weak areas

Typical behaviors:
- present question batches, defaulting to 5 questions
- score answers and provide explanation/feedback
- update progress snapshots and weak-area indicators
- decide whether learner should continue, review, or reinforce

Entry conditions:
- learner explicitly starts a quiz
- system judges topic ready for assessment
- review flow completes and confidence is sufficient

Expected outputs:
- answer attempts are recorded
- mastery signals are updated
- learner is routed toward next best state based on results

### 4. `reinforce`
Purpose:
- recover from confusion, low confidence, or poor quiz performance
- rebuild understanding through simpler questions, focused explanation, and encouragement
- keep the learner progressing without shame

Typical behaviors:
- narrow scope to one weak concept
- use easier questions or shorter prompts
- give constructive encouragement and progress language
- prepare learner to re-enter review or quiz later

Entry conditions:
- repeated incorrect answers
- learner indicates confusion or low confidence
- system detects weak-area or struggle pattern

Expected outputs:
- learner regains footing
- one or more weak concepts are clarified
- learner can transition back into review or quiz when stable

---

## State intent summary

| State | Main goal | Pressure level | Best for |
|---|---|---:|---|
| `learn` | First understanding | Low | New material |
| `review` | Consolidation and recall refresh | Low-medium | Previously seen material |
| `quiz` | Assessment and signal gathering | Medium-high | Checking understanding |
| `reinforce` | Recovery and targeted support | Low | Struggle or weak areas |

---

## Design rules for all states
- The learner should always know what mode they are in.
- State shifts should feel supportive, not punitive.
- `reinforce` is not a failure state; it is a support state.
- `review` should be available both before and after `quiz`.
- `learn` and `review` can include mini-check questions without becoming full `quiz` mode.
- State should be persisted at the session and project level for resume behavior.

---

## Schema mapping
The state machine maps primarily to:
- `learning_sessions.mode`
- `learning_sessions.status`
- `learning_projects.current_mode`
- `progress_snapshots.progress_state`
- `deferred_questions` when side-questions need to be parked for later

Recommended mode values:
- `learn`
- `review`
- `quiz`
- `reinforce`

---

## UX interpretation guidance

### Learn mode should feel like
- "Let me show you how this works."
- paced, explanatory, confidence-building

### Review mode should feel like
- "Let’s bring this back into focus."
- concise, memory-refreshing, grounding

### Quiz mode should feel like
- "Let’s check what’s sticking."
- fair, structured, useful, never shaming

### Reinforce mode should feel like
- "Let’s slow down and make this easier."
- protective, specific, and motivating

---

## Initial implementation guidance
- Implement these four modes as controlled values in session state.
- Let the backend own mode persistence and transition decisions.
- Let the frontend display simple user-facing labels and descriptions for each mode.
- Avoid overcomplicating the first implementation with nested submodes.
- Add richer interruption and deferred-question routing in the next checkpoint.
