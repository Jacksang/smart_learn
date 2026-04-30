# DB Comparison: Aurora Serverless v2 vs DynamoDB for 3-5 Users

**Date:** 2026-04-30 | **Prepared by:** Eva2 AI Guardian

---

## 📊 Usage Scenario: 5 Students, 1 Month

Each student: 2 sessions/day, uploads 3-5 textbooks, answers ~20 questions/session, tracks progress.

### Data Volume Estimate

| Table | Rows/Month | Avg Row Size | Total |
|-------|-----------|-------------|-------|
| users | 5 | 500 B | 2.5 KB |
| learning_projects | 20 | 400 B | 8 KB |
| source_materials | 80 | 1 KB | 80 KB |
| outlines + outline_items | 25 + 300 | 500 B | 160 KB |
| questions | 1,500 | 500 B | 750 KB |
| answer_attempts | 5,000 | 400 B | 2 MB |
| learning_sessions | 150 | 600 B | 90 KB |
| session_progress_snapshots | 600 | 300 B | 180 KB |
| session_summaries | 150 | 2 KB | 300 KB |
| session_mode_history | 300 | 200 B | 60 KB |
| notifications | 200 | 500 B | 100 KB |
| Other (auth, prefs, templates, logs, oauth) | 50 | 400 B | 20 KB |
| **TOTAL** | **~8,400 rows** | | **~3.8 MB** |

### Query Patterns (per day, 5 users)

| Operation | Reads/Day | Writes/Day |
|-----------|----------|-----------|
| Login / Profile fetch | 25 | — |
| Session CRUD (create, pause, resume, end) | 30 | 15 |
| Progress tracking (updates + snapshots) | 10 | 30 |
| Answer submissions | — | 100 |
| Quiz question fetch | 50 | — |
| Analytics queries (aggregations) | 10 | — |
| Notification fetch + mark read | 30 | 10 |
| Material upload | — | 3 |
| Summary generation (end session) | 10 | 10 |
| **TOTAL** | **~165/day** | **~168/day** |
| **MONTHLY** | **~5,000** | **~5,000** |

---

## 💰 Cost Comparison

### Aurora Serverless v2

| Component | Unit | Price | Monthly |
|-----------|------|-------|---------|
| ACU-hours (0.5 ACU min) | 365 ACU-hr | $0.12/hr | **$43.80** |
| Storage (4 MB) | Per GB | $0.10/GB | $0.00 |
| I/O (10K ops) | Per million | $0.20 | $0.00 |
| Backup (4 MB) | Per GB | $0.021/GB | $0.00 |
| **TOTAL** | | | **~$44/mo** |

> ⚠️ The 0.5 ACU minimum is the floor. Even with zero traffic, you pay ~$44/month because Aurora can't scale below 0.5 ACU.

### DynamoDB (On-Demand)

| Component | Unit | Price | Monthly |
|-----------|------|-------|---------|
| Write requests (5,000) | Per million | $1.25 | $0.01 |
| Read requests (5,000) | Per million | $1.25 | $0.01 |
| Storage (4 MB) | Per GB | $0.25/GB | $0.00 |
| Backup | Per GB | $0.10/GB | $0.00 |
| **TOTAL** | | | **~$0.02/mo** |

> 💡 At this scale, DynamoDB is effectively **free**. You'd need ~1,000 users before exceeding the free tier.

---

## 🔍 Capability Comparison by Scenario

### 1. Student Uploads Textbooks & Materials

| Requirement | Aurora ✅ | DynamoDB ⚠️ |
|------------|----------|------------|
| Store file metadata | `INSERT INTO source_materials` | PutItem |
| Associate with project | `FOREIGN KEY project_id` | GSI on project_id |
| Full-text search on content | `WHERE extracted_text ILIKE '%term%'` (or pg_trgm) | ❌ Not supported — need OpenSearch or Lambda scan |
| Weight management | `UPDATE SET weight = ? WHERE id = ?` | UpdateItem |
| List materials by project | `SELECT * WHERE project_id = ? ORDER BY` | Query with GSI |

### 2. Generate Outlines from Materials

| Requirement | Aurora ✅ | DynamoDB ⚠️ |
|------------|----------|------------|
| Generate outline items | `INSERT INTO outline_items` | BatchWrite (25 items max/batch) |
| Refresh on material change | `DELETE + INSERT` in transaction | TransactWriteItems (10 items max) |
| Get full outline tree | `JOIN outlines + outline_items ORDER BY` | ❌ No joins — 2 queries + client-side merge |

### 3. Answer Questions & Track Progress

| Requirement | Aurora ✅ | DynamoDB ⚠️ |
|------------|----------|------------|
| Submit answer | `INSERT INTO answer_attempts` | PutItem |
| Calculate accuracy | `SELECT COUNT(*) WHERE is_correct` with GROUP BY | ❌ No aggregation — scan + count in Lambda |
| Track per-topic mastery | `GROUP BY topic_id, AVG(score)` | ❌ Same — expensive scan or pre-computed counter |
| Weak area detection | Complex SQL with window functions | ❌ Requires DynamoDB Streams + Lambda analyzer |

### 4. Analytics Dashboard

| Requirement | Aurora ✅ | DynamoDB ❌ |
|------------|----------|------------|
| "Topics by accuracy" table | `SELECT topic, AVG(score), COUNT(*) GROUP BY topic` | Full table scan + Lambda compute |
| "Learning activity over time" | `SELECT DATE(created_at), COUNT(*) GROUP BY date` | Scan all snapshots + group in code |
| "Mastery trends" | `SELECT topic, mastery OVER (PARTITION BY topic ORDER BY date)` | Scan + manual windowing in Lambda |
| Paginated results | `LIMIT ? OFFSET ?` | ExclusiveStartKey pagination |

### 5. Session Summary Generation

| Requirement | Aurora ✅ | DynamoDB ⚠️ |
|------------|----------|------------|
| Aggregate session stats | Single SQL with COUNT, SUM, AVG, GROUP BY | Scan all snapshots for session + compute in Lambda |
| Identify weak areas | SQL subquery with percentile | Scan + sort + threshold in Lambda |
| Generate recommendations | Complex joins across 3-4 tables | Multiple Query calls + client join |

### 6. Notifications

| Requirement | Aurora ✅ | DynamoDB ⚠️ |
|------------|----------|------------|
| Paginated list by user | `SELECT * WHERE user_id = ? ORDER BY created_at DESC LIMIT 20` | Query with GSI, same pattern |
| Mark all read | `UPDATE SET is_read = true WHERE user_id = ?` | ❌ Must update each individually (or use BatchWrite) |
| Unread count | `SELECT COUNT(*) WHERE user_id = ? AND is_read = false` | ❌ Scan or maintain counter attribute |
| Delete by type filter | `DELETE WHERE user_id = ? AND type = ?` | ❌ Must Query first, then BatchWrite delete |

---

## ⚡ Performance Comparison (5 users, 3.8MB data)

| Metric | Aurora (0.5 ACU) | DynamoDB (on-demand) |
|--------|-----------------|---------------------|
| Simple query (GET by ID) | ~5-10ms | ~3-5ms |
| Join query (3 tables) | ~20-50ms | ❌ N/A (must do 3 queries) |
| Aggregation (GROUP BY) | ~30-100ms | ❌ N/A (must scan + compute) |
| List with pagination | ~10-20ms | ~5-10ms |
| Concurrent writes (5 users) | ~50ms (ACID) | ~10ms (eventual consistency) |
| Cold start (idle period) | ~1-3 seconds | 0ms (always warm) |
| Max connections | ~200 | Unlimited (HTTP API) |

---

## 🔒 Constraints & Limitations

### Aurora Serverless v2
| Constraint | Impact (3-5 users) |
|------------|-------------------|
| 0.5 ACU minimum (~2GB RAM) | Way overkill — you're paying for unused capacity |
| Cold start after pause | 1-3 seconds after idle period |
| Single region | Good enough for MVP |
| Max 128 TB storage | Irrelevant at this scale |
| VPC required | Adds complexity to Lambda setup |

### DynamoDB
| Constraint | Impact (3-5 users) |
|------------|-------------------|
| No JOINs | Every analytics query needs Lambda code |
| No aggregation (SUM/AVG/COUNT/GROUP BY) | Client-side processing |
| 400KB item size limit | Large extracted text from materials may need S3 |
| No full-text search | Can't search materials by keyword |
| 25 items per BatchWrite | Pagination when bulk-inserting questions |
| 10 items per transaction | Limited ACID support |
| GSI limits (20 per table) | Must plan access patterns upfront |
| Query requires exact PK | Can't do "SELECT * WHERE user_id=? AND status=?" without GSI |

---

## 🎯 Verdict

| Factor | Aurora Serverless | DynamoDB | Winner |
|--------|------------------|----------|--------|
| **Monthly cost** (5 users) | ~$44/mo | ~$0.02/mo | 🏆 DynamoDB |
| **Development effort** | 0 hours (existing code) | ~200 hours (full rewrite) | 🏆 Aurora |
| **Time to launch** | This week | 5-6 weeks | 🏆 Aurora |
| **Query power** | Full SQL | Key-value only | 🏆 Aurora |
| **Analytics support** | Native | Must build in Lambda | 🏆 Aurora |
| **Scalability** (1→1000 users) | Auto-scales | Auto-scales | 🏆 Tie |
| **Operational overhead** | Low | Very low | 🏆 DynamoDB |
| **For 3-5 users** | Overpowered, overpriced | Perfect fit | 🏆 DynamoDB |

---

## 🚀 Recommended Strategy

**Phase 1 — Launch with Aurora (this week):**
- Deploy existing code, zero rewrites
- Accept $44/month for speed-to-market
- Gather real usage data

**Phase 2 — Evaluate after 1-2 months:**
- If user count stays <10: Is $44/month acceptable? If yes, stay.
- If cost bothers you: Migrate to DynamoDB (plan for 5-6 weeks work)

**Phase 3 — Potential hybrid:**
- Keep user/profile/session data in DynamoDB (simple CRUD)
- Move analytics to pre-computed aggregations
- This splits the difference but adds architecture complexity

---

### 💡 If You Absolutely Want DynamoDB Now:

I can re-implement the data layer. It's doable but time-consuming. The work would be:
1. Design single-table schema (2-3 days)
2. Rewrite all 40+ repository functions (2-3 weeks)
3. Rewrite service layer for client-side aggregation (1 week)
4. Testing all 40 endpoints (1 week)

I'm ready either way — just say the word.
