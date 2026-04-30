# Smart Learn — Student Materials Storage: Local vs S3

**Date:** 2026-04-30 | **Prepared by:** Eva2 AI Guardian

---

## ⚠️ Student Materials Grow MUCH Faster Than Metadata

| Data Type | Growth Rate | 5 Users | 50 Users | 500 Users |
|-----------|------------|---------|----------|-----------|
| Metadata (DB) | ~1 MB/student/mo | 3.8 MB | 80 MB | 1 GB |
| **Text materials** (PDF, DOCX) | ~50 MB/student | 250 MB | **2.5 GB** | **25 GB** |
| **Audio** (recordings) | ~30 MB/file | 150 MB | 1.5 GB | 15 GB |
| **Video** (lectures) | ~300 MB/file | 1.5 GB | **15 GB** | **150 GB** |
| **TOTAL (worst case)** | | **~2 GB** | **~20 GB** | **~200 GB** |

> **Metadata grows linearly. Materials grow exponentially. Even modest video uploads from a few students can blow past local disk limits.**

---

## 🔴 The Local Storage Problem

**Lightsail $10/mo (2GB RAM, 80GB SSD):**

| What consumes SSD | Space |
|-------------------|-------|
| Ubuntu OS + Docker | ~15 GB |
| PostgreSQL data | ~5 GB (at 500 users) |
| Docker images | ~3 GB |
| Logs + temp files | ~2 GB |
| **Remaining for materials** | **~55 GB** |

At 500 students with mixed media, you need **200GB** — nearly 4x the available space.

**You'd hit the wall at ~150-200 students** and be forced into emergency migration.

---

## 🟢 S3 From Day 1 — The Right Call

S3 at our scale is practically free:

| Students | Avg Storage | S3 Cost/mo | GET Requests | Total |
|----------|------------|------------|-------------|-------|
| 5 | 250 MB | **$0.01** | ~500/mo | **$0.01** |
| 50 | 2.5 GB | **$0.06** | ~5,000/mo | **$0.07** |
| 200 | 15 GB | **$0.35** | ~20,000/mo | **$0.38** |
| 500 | 50 GB | **$1.15** | ~50,000/mo | **$1.25** |
| 1,000 | 100 GB | **$2.30** | ~100,000/mo | **$2.50** |

> **At 500 students, S3 costs $1.25/month. That's less than the extra RAM you'd need to buy for a bigger Lightsail instance to hold the files locally.**

---

## 🏗️ Architecture: S3 for Files, VM for Compute

```
                    ┌─────────────────┐
                    │   CloudFront     │  Optional: caches S3 globally
                    │   (free tier)    │
                    └────┬───────┬─────┘
                         │       │
              ┌──────────┘       └──────────┐
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │   S3 Bucket      │           │   Lightsail $10  │
    │   (materials)    │           │   (app + DB)     │
    │                  │           │                  │
    │ /textbooks/      │           │ Node.js backend  │
    │ /audio/          │◄──────────│ uploads to S3    │
    │ /video/          │  presign  │ generates URLs    │
    │ /images/         │           │                  │
    │                  │           │ PostgreSQL meta   │
    │ $0.01/mo (5usr)  │           │ $10/mo           │
    └─────────────────┘           └─────────────────┘
```

**How it works:**
1. Student uploads textbook → backend receives file in memory (multer memoryStorage)
2. Backend streams file to S3 via `@aws-sdk/client-s3`
3. Backend stores S3 key in `source_materials.storage_path`
4. When student requests file → backend generates a presigned URL (valid 1 hour)
5. Browser loads directly from S3 (or CloudFront)

---

## 📦 Minimal Code Changes Required

The backend already has file ingestion (`backend/src/ingestion/`). We just need to swap `multer.diskStorage` → `multer.memoryStorage` + S3 upload.

### New dependency
```json
"@aws-sdk/client-s3": "^3.x"
```

### New utility file
```js
// backend/src/storage/s3.js (NEW — ~50 lines)
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET = process.env.S3_BUCKET || 'smartlearn-materials';

async function uploadFile(key, buffer, mimeType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buffer, ContentType: mimeType
  }));
  return `s3://${BUCKET}/${key}`;
}

async function getDownloadUrl(key, expiresIn = 3600) {
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: BUCKET, Key: key
  }), { expiresIn });
}

module.exports = { uploadFile, getDownloadUrl };
```

### Change in ingestion service (1 line change)
```js
// OLD: save to local disk
const filePath = path.join(uploadsDir, fileName);

// NEW: upload to S3
const s3Key = `materials/${projectId}/${fileName}`;
const filePath = await s3.uploadFile(s3Key, fileBuffer, mimeType);
```

**Total code change: ~80 lines. One new file, one modified file.**

---

## 🗂️ S3 Bucket Structure

```
smartlearn-materials/
├── user-{id}/
│   ├── textbooks/
│   │   └── calculus-101.pdf
│   ├── notes/
│   │   └── chapter-3.docx
│   ├── audio/
│   │   └── lecture-recording.mp3
│   └── video/
│       └── lab-demo.mp4
├── project-{id}/
│   └── shared-materials/
└── exports/
    └── user-{id}-data-export.zip
```

### S3 Lifecycle Rules (set once, save forever)
```json
{
  "Rules": [
    {
      "Id": "ExpireTemporaryUploads",
      "Prefix": "temp/",
      "Expiration": { "Days": 1 }
    },
    {
      "Id": "TransitionToCheaperStorage",
      "Prefix": "",
      "Transitions": [
        { "Days": 90, "StorageClass": "STANDARD_IA" }  // ~50% cheaper
      ]
    }
  ]
}
```

**STANDARD_IA after 90 days:** Automatically moves old materials to cheaper storage ($0.0125/GB vs $0.023/GB). No code changes — S3 handles it transparently.

---

## 📊 Full Cost Projection (Lightsail + S3)

| Students | App VM | DB | S3 Storage | S3 Transfer | **Total** |
|----------|--------|----|-----------|-------------|-----------|
| 5 | $10 | — | $0.01 | $0.00 | **$10.01** |
| 50 | $10 | — | $0.06 | $0.01 | **$10.07** |
| 200 | $10 | $15 | $0.35 | $0.10 | **$25.45** |
| 500 | $20×2 | $30 | $1.15 | $0.50 | **$71.65** |
| 1,000 | $40×2 | $90 | $2.30 | $1.00 | **$173.30** |

> **S3 adds $0.01 to $2.30/month to the bill. Completely negligible.**

---

## 🎯 Recommendation

**Use S3 from day 1.**

| Reason | Impact |
|--------|--------|
| Cost now | $0.01/mo — free |
| Code change | ~80 lines, 1 new file |
| Migration pain avoided | Priceless — moving 50GB+ later is a nightmare |
| Lightsail stays small | $10/mo VM, not $40/mo for bigger disk |
| Automatic backups | S3 has 99.999999999% durability |
| Future CDN ready | Add CloudFront with one checkbox |
| Lifecycle policies | Auto-archive old files to cheaper storage |

**The only question:** Do you want me to implement the S3 integration right now alongside the Docker deployment files? It's ~80 lines of code and ready in under 30 minutes.