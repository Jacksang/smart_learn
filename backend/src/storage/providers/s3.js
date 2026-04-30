/**
 * AWS S3 Storage Provider
 *
 * STORAGE_PROVIDER=s3
 * Environment variables:
 *   S3_BUCKET       - bucket name (default: smartlearn-materials)
 *   S3_REGION       - AWS region  (default: ap-southeast-1)
 *   S3_ENDPOINT     - custom endpoint for S3-compatible services (MinIO, etc.)
 *
 * Auto-detects AWS credentials via the standard chain:
 *   env vars → ~/.aws/credentials → IAM role (EC2/Lambda)
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3Provider {
  constructor() {
    const region = process.env.S3_REGION || 'ap-southeast-1';
    const endpoint = process.env.S3_ENDPOINT || undefined;

    this.bucket = process.env.S3_BUCKET || 'smartlearn-materials';
    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
  }

  /**
   * Upload a file to S3.
   */
  async upload(key, buffer, mimeType) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream',
    }));

    return {
      key,
      url: `s3://${this.bucket}/${key}`,
      provider: 's3',
      bucket: this.bucket,
    };
  }

  /**
   * Generate a presigned download URL (valid for expiresIn seconds).
   */
  async getSignedUrl(key, expiresIn = 3600) {
    return getSignedUrl(this.client, new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }), { expiresIn });
  }

  /**
   * Delete a file from S3.
   */
  async delete(key) {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  /**
   * Check whether a file exists in S3.
   */
  async exists(key) {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }
}

module.exports = S3Provider;
