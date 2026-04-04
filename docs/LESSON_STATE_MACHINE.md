# Smart Learn Lesson State Machine

## Status
Completed checkpoints in this document:
- Define Learn / Review / Quiz / Reinforce states
- Define transitions and interruption handling
- Define deferred-question behavior
- Save artifact: `docs/LESSON_STATE_MACHINE.md`

This document is now the delivery artifact for D0.3.

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

## Transition model and interruption handling

### Canonical transition graph

```text
start -> learn
learn -> review      when learner finishes an explanation block and needs recall refresh
learn -> quiz        when learner requests assessment or system judges readiness is high
learn -> reinforce   when confusion or repeated failed checks appear

review -> learn      when new explanation is needed before continuing
review -> quiz       when refreshed understanding is strong enough for assessment
review -> reinforce  when weak recall or low confidence is detected
review -> review     when another recap pass is intentionally requested

quiz -> review       when performance is mixed and refresh should happen before retry
quiz -> reinforce    when struggle threshold is crossed
quiz -> learn        when misunderstanding shows the concept was never really built
quiz -> quiz         when another batch is explicitly requested and readiness remains high

reinforce -> review  when the learner regains baseline understanding
reinforce -> learn   when re-teaching is needed from a simpler angle
reinforce -> quiz    only when the learner explicitly wants to retry and confidence has recovered
reinforce -> reinforce when multiple weak subtopics need focused support in sequence

any state -> paused  when the learner stops, disconnects, or leaves mid-step
paused -> prior state on resume when the interrupted step is still valid
paused -> review     on resume after a long break or stale context
paused -> reinforce  on resume if the interruption happened during visible struggle
```

### Transition decision rules
- The backend should treat transitions as explicit decisions with a `from_state`, `to_state`, `reason`, and timestamp recorded on the session timeline.
- User intent can force some transitions, but safety rails still apply. Example: if the learner asks for quiz mode while the system sees strong struggle signals, the system may route through `review` or `reinforce` first and explain why.
- `quiz -> learn` is allowed when incorrect answers reveal the learner lacks the underlying concept, not just recall strength.
- `reinforce -> quiz` should be comparatively rare; default recovery path is `reinforce -> review -> quiz`.
- A transition should happen only after finishing the current instructional atom unless there is an interruption, explicit stop, or severe confusion signal.

### Transition triggers by signal

| Signal | Likely transition | Notes |
|---|---|---|
| New topic selected | `start -> learn` | Default path for unseen material |
| Learner asks for recap | `learn/reinforce -> review` | Use for lighter pressure refresh |
| Good comprehension checks | `learn/review -> quiz` | Requires sufficient readiness |
| Mixed quiz results | `quiz -> review` | Review weak concepts, then retry |
| Repeated wrong answers | `quiz/review -> reinforce` | Lower difficulty and narrow scope |
| Strong confusion statement | `any active state -> reinforce` | "I don't get this" should immediately soften the flow |
| Need fresh teaching angle | `review/quiz/reinforce -> learn` | Rebuild concept from first principles |
| User requests another assessment batch | `quiz -> quiz` | Preserve batch progression |
| User leaves or session expires | `any active state -> paused` | Save state atomically |

### Interruption handling

#### Supported interruption types
1. **Soft interruption**
   - learner asks a brief clarifying question related to the current step
   - current state does not change
   - system answers, then resumes the same instructional atom

2. **Side-topic interruption**
   - learner asks a relevant but non-blocking question outside the immediate lesson step
   - current flow is preserved
   - question may be answered now if short, or parked for later if it would derail momentum

3. **Hard interruption**
   - learner stops responding, closes the session, switches topic, or requests to pause
   - system transitions to `paused` and stores resumable context

4. **Struggle interruption**
   - learner frustration, repeated failure, or explicit confidence drop interrupts the current path
   - system can interrupt the planned next step and route to `reinforce`

#### Resume rules
- Persist the last stable state, current topic, current outline item, current quiz batch, and unfinished step payload before acknowledging a pause.
- On resume after a short gap, return to the prior state and restate the next action in one sentence.
- On resume after a longer gap, route through `review` instead of dropping the learner back into a stale quiz or explanation.
- If the learner left during obvious struggle, resume with `reinforce` or `review`, not straight back into the same failing question.

#### Interruption guardrails
- Never silently discard in-progress learner answers.
- Never resume directly into a punitive-feeling quiz after a frustrating interruption.
- Interruptions should preserve emotional continuity: the learner should feel remembered, not reset.
- State changes caused by interruptions should be visible in session history for debugging and analytics.

## Deferred-question behavior

### Why deferred questions exist
Deferred questions are the lesson-safe way to handle curiosity without letting the session lose structure. They are useful when a learner asks something that is relevant, interesting, or important, but answering it immediately would break the current teaching sequence.

### When to defer a question
Defer instead of answering immediately when one or more of these are true:
- answering requires leaving the current topic or outline step
- the learner is in the middle of a quiz batch and the answer would contaminate assessment
- the question is important but long-form, and the current lesson momentum is more valuable
- the learner is already struggling and an extra branch would increase overload
- the answer depends on content that will be taught naturally later in the outline

### When not to defer
Do **not** defer when:
- the learner is blocked from understanding the current step without the answer
- the question is a short clarification that keeps momentum intact
- the learner explicitly says the side-question matters more than the current lesson goal

### Deferred-question lifecycle
1. **Capture**
   - save the learner question text, session id, project id, topic id or outline item id, current state, and reason for deferral
2. **Acknowledge**
   - tell the learner the question is worth keeping and will be revisited
3. **Continue current flow**
   - return the learner to the active instructional atom without switching modes unless struggle signals require it
4. **Queue for revisit**
   - place the question in a session parking lot ordered by urgency and relevance
5. **Revisit**
   - answer it during a natural breakpoint: end of topic, end of quiz batch, end-of-session summary, or explicit learner request
6. **Resolve**
   - mark answered, skipped, merged into another question, or promoted into future lesson content

### Deferred-question priorities

| Priority | Meaning | Typical handling |
|---|---|---|
| `blocking` | Actually needed to proceed | Should not stay deferred; answer before continuing |
| `same_topic` | Relevant to current topic but not needed immediately | Revisit at next checkpoint or end of current step |
| `next_topic` | Better answered in upcoming material | Link to future outline item and revisit there |
| `parking_lot` | Useful curiosity, not time-critical | Cover in end-of-session review or dedicated revisit flow |

### Revisit rules
- The system should surface deferred questions at clear boundaries, not randomly in the middle of a high-focus interaction.
- Quiz mode should usually revisit deferred questions only **after** the scored batch completes.
- Review mode is a good place to revisit `same_topic` questions because it naturally supports elaboration.
- End-of-session summaries should include unresolved deferred questions and suggest whether to answer them next time.
- If many deferred questions accumulate, the system should group them by topic to avoid fragmented context switching.

### UX language guidance
Use language that makes deferral feel respectful rather than dismissive. For example:
- “That’s a good question — I’m parking it so we don’t lose this thread.”
- “Let’s finish this check first, then come right back to that.”
- “That belongs to the next concept, so I’ll bring it back when we get there.”

Avoid language that sounds like the learner is being ignored.

### Data and analytics notes
Recommended deferred-question fields:
- `id`
- `learning_session_id`
- `learning_project_id`
- `outline_item_id` nullable
- `topic_ref` or topic label
- `question_text`
- `source_state` (`learn`, `review`, `quiz`, `reinforce`)
- `priority`
- `deferral_reason`
- `status` (`open`, `answered`, `skipped`, `merged`)
- `revisit_trigger` (`after_step`, `after_batch`, `end_of_topic`, `end_of_session`, `manual`)
- `answered_at`

Useful metrics:
- deferred questions per session
- percent resolved in same session
- common deferral reasons
- whether high deferral volume correlates with struggle or engagement

## Initial implementation guidance
- Implement these four modes as controlled values in session state.
- Let the backend own mode persistence and transition decisions.
- Let the frontend display simple user-facing labels and descriptions for each mode.
- Avoid overcomplicating the first implementation with nested submodes.
- Start with the canonical transitions above before adding probabilistic routing.
