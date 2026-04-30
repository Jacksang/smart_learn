# How to Add a New Storage Provider

The storage layer uses a **provider pattern** — add one file, register it, done.

---

## Interface (Every Provider Must Implement)

```js
class MyCloudProvider {
  async upload(key, buffer, mimeType) → { key, url, provider }
  async getSignedUrl(key, expiresIn)  → url (string)
  async delete(key)                    → void
  async exists(key)                    → boolean
}
```

---

## Step 1: Create the Provider File

### Example: Azure Blob Storage

```js
// backend/src/storage/providers/azure.js

const { BlobServiceClient } = require('@azure/storage-blob');

class AzureProvider {
  constructor() {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.container = process.env.AZURE_CONTAINER || 'smartlearn-materials';
    this.client = BlobServiceClient.fromConnectionString(connStr);
    this.containerClient = this.client.getContainerClient(this.container);
  }

  async upload(key, buffer, mimeType) {
    const blockClient = this.containerClient.getBlockBlobClient(key);
    await blockClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return { key, url: blockClient.url, provider: 'azure' };
  }

  async getSignedUrl(key, expiresIn = 3600) {
    const blockClient = this.containerClient.getBlockBlobClient(key);
    // Azure uses SAS tokens for signed URLs
    const { BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob');
    const sasToken = generateBlobSASQueryParameters({
      containerName: this.container,
      blobName: key,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn: new Date(Date.now() + expiresIn * 1000),
    }, this.client.credential).toString();
    return `${blockClient.url}?${sasToken}`;
  }

  async delete(key) {
    const blockClient = this.containerClient.getBlockBlobClient(key);
    await blockClient.deleteIfExists();
  }

  async exists(key) {
    const blockClient = this.containerClient.getBlockBlobClient(key);
    return blockClient.exists();
  }
}

module.exports = AzureProvider;
```

### Example: Alibaba Cloud OSS

```js
// backend/src/storage/providers/aliyun.js

const OSS = require('ali-oss');

class AliyunProvider {
  constructor() {
    this.bucket = process.env.ALIYUN_BUCKET;
    this.client = new OSS({
      region: process.env.ALIYUN_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      bucket: this.bucket,
    });
  }

  async upload(key, buffer, mimeType) {
    const result = await this.client.put(key, Buffer.from(buffer), {
      mime: mimeType,
    });
    return { key, url: result.url, provider: 'aliyun' };
  }

  async getSignedUrl(key, expiresIn = 3600) {
    return this.client.signatureUrl(key, { expires: expiresIn });
  }

  async delete(key) {
    await this.client.delete(key);
  }

  async exists(key) {
    try {
      await this.client.head(key);
      return true;
    } catch (e) {
      if (e.code === 'NoSuchKey') return false;
      throw e;
    }
  }
}

module.exports = AliyunProvider;
```

---

## Step 2: Register in the Factory

```js
// backend/src/storage/provider.js

const AzureProvider = require('./providers/azure');    // ← add
const AliyunProvider = require('./providers/aliyun');  // ← add

const PROVIDERS = {
  local: LocalProvider,
  s3: S3Provider,
  azure: AzureProvider,    // ← add
  aliyun: AliyunProvider,  // ← add
};
```

---

## Step 3: Configure Environment

```bash
# Azure
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Alibaba
STORAGE_PROVIDER=aliyun
ALIYUN_BUCKET=smartlearn-materials
ALIYUN_REGION=oss-cn-hangzhou
ALIYUN_ACCESS_KEY_ID=xxx
ALIYUN_ACCESS_KEY_SECRET=xxx

# AWS (already implemented)
STORAGE_PROVIDER=s3
S3_BUCKET=smartlearn-materials
S3_REGION=us-east-1

# Development (default)
STORAGE_PROVIDER=local
```

---

## Step 4: Deploy — Zero App Code Changes

The entire app calls `storage.upload()` / `storage.getSignedUrl()` — it doesn't know or care which cloud is behind it. Switching clouds is a one-line env var change.

```
STORAGE_PROVIDER=s3     →  AWS S3
STORAGE_PROVIDER=azure  →  Azure Blob
STORAGE_PROVIDER=aliyun →  Alibaba OSS
STORAGE_PROVIDER=local  →  Local disk
```

---

## No Lock-in — Ever

| Cloud | Provider File | Env Var | Status |
|-------|-------------|---------|--------|
| Local filesystem | `providers/local.js` | `local` | ✅ Built |
| AWS S3 | `providers/s3.js` | `s3` | ✅ Built |
| Azure Blob | `providers/azure.js` | `azure` | 📝 Template ready |
| Alibaba OSS | `providers/aliyun.js` | `aliyun` | 📝 Template ready |
| GCP Cloud Storage | Copy template | `gcp` | 🔮 Future |
| MinIO (self-hosted) | — | `s3` + `S3_ENDPOINT` | ✅ Works now |

> **MinIO works today** — it's S3-compatible. Just set `S3_ENDPOINT=http://minio:9000` and the S3 provider connects to your self-hosted MinIO.

---

## Pricing Comparison (500 students, 50GB)

| Provider | Storage | Transfer | **Total/mo** |
|----------|---------|----------|------------|
| AWS S3 | $1.15 | $0.50 | **$1.65** |
| Azure Blob (Hot) | $1.04 | $0.00* | **$1.04** |
| Alibaba OSS | $0.88 | $0.00* | **$0.88** |
| MinIO (self-hosted) | $0 | $0 | **$0** |

*In-region transfer. Cross-region varies.

All within $2/month at 500 students. The provider choice is about ecosystem preference, not cost.

## Recommended Strategy

```
Development:          STORAGE_PROVIDER=local   (free, fast, no network)
Production (AWS):     STORAGE_PROVIDER=s3      (native integration)
Production (Alibaba): STORAGE_PROVIDER=aliyun  (best for Chinese market)
Production (Azure):   STORAGE_PROVIDER=azure   (enterprise compliance)
```
