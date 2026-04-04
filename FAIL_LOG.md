# Smart Learn Fail Log

## 2026-04-04

### Event
A one-shot worker run returned corrupted/unreadable output while attempting to continue the next unfinished checkpoint after `D0.2` and the first part of `D0.3`.

### Observed symptom
- Result text was garbled and not reliable enough to treat as a meaningful project outcome.
- No concrete artifact or commit was reported from that failed run.

### Immediate handling taken
- Treated as a failed worker run rather than a valid project blocker.
- Started a fresh worker from current repo state.

### Corrective protocol now adopted
- Failed worker runs must be reported or logged.
- If the same task fails twice, stop and analyze before retrying.
- If task scope is too large, break it into a sub-checkpoint file and recurse.
