# Quick Start - GCP Deployment

## ⚡ TL;DR Setup (5 minutes)

### 1. Create GCP Project
```bash
gcloud projects create learning-tracker --display-name="Learning Tracker"
gcloud config set project learning-tracker
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create learning-tracker --repository-format=docker --location=us-central1
```

### 2. Create Service Account & Workload Identity
```bash
gcloud iam service-accounts create github-actions-sa --display-name="GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding learning-tracker \
  --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding learning-tracker \
  --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding learning-tracker \
  --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"

gcloud projects add-iam-policy-binding learning-tracker \
  --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create Workload Identity Pool & Provider
gcloud iam workload-identity-pools create "github-pool" \
  --project="learning-tracker" \
  --location="global" \
  --display-name="GitHub Actions Pool"

gcloud iam workload-identity-pools providers create-oidc "github" \
  --project="learning-tracker" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud,assertion.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Grant Workload Identity access
gcloud iam service-accounts add-iam-policy-binding github-actions-sa@learning-tracker.iam.gserviceaccount.com \
  --project="learning-tracker" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_REPO"
```

Replace `PROJECT_NUMBER` with:
```bash
gcloud projects describe learning-tracker --format='value(projectNumber)'
```

Replace `YOUR_GITHUB_REPO` with your GitHub repo (e.g., `rajeshkr2016/git`)

### 3. Get Configuration Values
```bash
# Get Project ID
PROJECT_ID=$(gcloud config get-value project)
echo "GCP_PROJECT_ID=$PROJECT_ID"

# Get Workload Identity Provider
WIP=$(gcloud iam workload-identity-pools providers describe github \
  --project=learning-tracker \
  --location=global \
  --workload-identity-pool=github-pool \
  --format='value(name)')
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=$WIP"

# Get Service Account
SA="github-actions-sa@learning-tracker.iam.gserviceaccount.com"
echo "GCP_SERVICE_ACCOUNT=$SA"
```

### 4. Add GitHub Secrets
Go to GitHub repo → Settings → Secrets and variables → Actions

Add:
- `GCP_PROJECT_ID` = your project ID
- `GCP_WORKLOAD_IDENTITY_PROVIDER` = workload identity provider path
- `GCP_SERVICE_ACCOUNT` = service account email

### 5. Deploy!
```bash
git push origin main
# Watch GitHub Actions → gcp-cloudrun-deploy
```

Or manually trigger from GitHub Actions UI.

## 📋 Checklist

- [ ] GCP project created
- [ ] Required APIs enabled
- [ ] Artifact Registry repository created
- [ ] Service account created
- [ ] IAM roles assigned
- [ ] Workload Identity Pool created
- [ ] Workload Identity Provider created
- [ ] Service account Workload Identity access granted
- [ ] GitHub Secrets added (`GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`)
- [ ] Docker Hub secrets added (`DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`)
- [ ] Push to main or manually trigger workflow

## 🔗 Service URLs

After deployment:

```bash
# Get Cloud Run service URL
gcloud run services describe learning-tracker-app \
  --region=us-central1 \
  --format='value(status.url)'
```

API endpoints:
- Health: `https://learning-tracker-app-xxxxx.run.app/api/health`
- Tasks: `https://learning-tracker-app-xxxxx.run.app/api/tasks`

## 🐛 Troubleshooting

**Error: "Could not generate access token"**
→ Check Workload Identity pool and provider are correctly configured

**Error: "Permission denied" on Artifact Registry**
→ Verify `roles/artifactregistry.writer` is assigned to service account

**Error: "Service not found" on Cloud Run deploy**
→ Service is created automatically on first deploy; it may take a minute

**Workflow still running?**
→ Check GitHub Actions logs for details; first run may take 2-3 minutes

## 📚 Full Guides

- [GCP-DEPLOYMENT.md](./GCP-DEPLOYMENT.md) — Detailed setup guide
- [DEPLOYMENT-PIPELINE.md](./DEPLOYMENT-PIPELINE.md) — Workflow overview
- [README.md](./README.md) — Quick start guide
