# AWS Setup Guide for Smart Learn Deployment

**Goal:** Get Smart Learn running on AWS Lightsail with CI/CD auto-deployment.

---

## Step 1: Create Lightsail VM (Singapore)

```bash
aws lightsail create-instances \
  --instance-name smartlearn \
  --availability-zone ap-southeast-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id medium_1_0
```
This creates a 2GB RAM VM. Cost: $10/month. Note the public IP from the output.

## Step 2: Create and Attach Static IP

```bash
aws lightsail allocate-static-ip --static-ip-name smartlearn-ip
aws lightsail attach-static-ip \
  --static-ip-name smartlearn-ip \
  --instance-name smartlearn
```
Now get the static IP:
```bash
aws lightsail get-static-ip --static-ip-name smartlearn-ip \
  --query 'staticIp.ipAddress' --output text
```
Save this IP — it will be your `LIGHTSAIL_HOST` secret.

## Step 3: Open Ports 80 (HTTP) and 443 (HTTPS)

```bash
aws lightsail open-instance-public-ports --instance-name smartlearn \
  --port-info fromPort=80,toPort=80,protocol=TCP
aws lightsail open-instance-public-ports --instance-name smartlearn \
  --port-info fromPort=443,toPort=443,protocol=TCP
aws lightsail open-instance-public-ports --instance-name smartlearn \
  --port-info fromPort=22,toPort=22,protocol=TCP
```

## Step 4: Set Up SSH Access

Generate an SSH key (on your local machine, NOT on the VM):
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/smartlearn-key -N ""
```

Upload to Lightsail:
```bash
aws lightsail import-key-pair \
  --key-pair-name smartlearn-key \
  --public-key-base64 "$(cat ~/.ssh/smartlearn-key.pub | base64)"
```

The private key content (`~/.ssh/smartlearn-key`) will be your `LIGHTSAIL_SSH_KEY` secret. Get it:
```bash
cat ~/.ssh/smartlearn-key
```
Copy the ENTIRE output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

## Step 5: SSH In and Install Docker

```bash
ssh -i ~/.ssh/smartlearn-key ubuntu@<YOUR_STATIC_IP>
```
Once in:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker
docker --version  # verify
exit
```

## Step 6: Clone and First Deploy

```bash
ssh -i ~/.ssh/smartlearn-key ubuntu@<YOUR_STATIC_IP>
git clone https://github.com/Jacksang/smart_learn.git
cd smart_learn
cp .env.example .env

# Edit .env with your secrets
nano .env
# Set DB_PASSWORD to a strong password
# Set JWT_SECRET to: openssl rand -hex 32

# First deploy
docker compose up -d --build
```

Verify:
```bash
curl http://localhost/api/health
# Should return {"status":"OK","message":"Smart Learn API is running"}
curl http://localhost/
# Should return HTML (the Vue app)
```

## Step 7: Generate JWT Secret
```bash
openssl rand -hex 32
```
Copy the output — this is your `JWT_SECRET`.

## Step 8: Set GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add these 5 secrets:

| Name | Value | How to get it |
|------|-------|---------------|
| `LIGHTSAIL_HOST` | Your static IP (e.g., `13.229.1.2`) | From Step 2 |
| `LIGHTSAIL_SSH_KEY` | Full private key content | From Step 4 (`cat ~/.ssh/smartlearn-key`) |
| `DB_PASSWORD` | Strong password you chose | From Step 6 (your choice) |
| `JWT_SECRET` | Random hex string | From Step 7 |
| `STORAGE_PROVIDER` | `local` | Or `s3` if using S3 |

## Step 9: Test CI/CD

Push any change to `main` branch:
```bash
git commit --allow-empty -m "test: CI/CD pipeline"
git push origin main
```

Go to GitHub → **Actions** tab. Watch the deployment run. After it completes, verify:
```bash
curl http://<YOUR_IP>/api/health
```

---

## (Optional) Step 10: Set Up S3 for Material Storage

Only if you want students to upload files to S3 instead of local disk:

```bash
# Create bucket (bucket names are globally unique)
BUCKET="smartlearn-materials-$(aws sts get-caller-identity --query Account --output text)"
aws s3 mb s3://$BUCKET --region ap-southeast-1 --create-bucket-configuration LocationConstraint=ap-southeast-1

# Enable encryption
aws s3api put-bucket-encryption --bucket $BUCKET \
  --server-side-encryption-configuration '{
    "Rules":[{
      "ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}
    }]
  }'

# Create IAM user for programmatic S3 access
aws iam create-user --user-name smartlearn-s3

# Attach S3 access policy
aws iam put-user-policy --user-name smartlearn-s3 --policy-name s3-access \
  --policy-document '{
    "Version":"2012-10-17",
    "Statement":[{
      "Effect":"Allow",
      "Action":["s3:PutObject","s3:GetObject","s3:DeleteObject"],
      "Resource":"arn:aws:s3:::'$BUCKET'/*"
    }]
  }'

# Create access key
aws iam create-access-key --user-name smartlearn-s3
# Save the AccessKeyId and SecretAccessKey from output

# On Lightsail, add to .env:
# STORAGE_PROVIDER=s3
# S3_BUCKET=smartlearn-materials-123456789
# S3_REGION=ap-southeast-1
# Or set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in environment
```

---

## (Optional) Step 11: Set Up Domain (eva9.ai)

```bash
# In Route 53, create A record:
# smartlearn.eva9.ai → <YOUR_STATIC_IP>

# Or in Lightsail DNS:
# Lightsail → Domains & DNS → Create DNS zone → eva9.ai
# Add A record: smartlearn → static IP
```

---

## Secrets Summary

| Where | What secrets |
|-------|-------------|
| **GitHub Actions Secrets** | LIGHTSAIL_HOST, LIGHTSAIL_SSH_KEY, DB_PASSWORD, JWT_SECRET, STORAGE_PROVIDER |
| **Lightsail VM (.env)** | DB_PASSWORD, JWT_SECRET — set by GitHub Actions on each deploy |
| **AWS IAM (optional)** | smartlearn-s3 user credentials for S3 access |
| **AWS Secrets Manager (future)** | Can replace .env for production-grade secret management |

---

## Monthly Cost

| Resource | Cost |
|----------|------|
| Lightsail VM (2GB) | $10.00 |
| Static IP | Free |
| S3 (materials, optional) | ~$0.01 |
| Route 53 (domain, optional) | $0.50 |
| **TOTAL** | **$10.50/mo** |
