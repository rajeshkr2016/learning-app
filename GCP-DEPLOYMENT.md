# GCP Cloud Run Deployment Guide

This guide provides step-by-step instructions to deploy the Learning Tracker application to Google Cloud Run using GitHub Actions.

## Prerequisites

- Google Cloud Platform (GCP) account with billing enabled
- GitHub repository with the learning tracker code
- Docker Hub account with the `learning-tracker` image pushed
- Basic familiarity with GCP and GitHub Actions

## Architecture Overview

```
┌─────────────────────┐
│   GitHub Actions    │
│  (Workflow Trigger) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Pull from Docker Hub               │
│  docker.io/username/learning-tracker│
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Tag for GCP Artifact Registry      │
│  us-central1-docker.pkg.dev/...     │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Push to GCP Artifact Registry      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Deploy to Cloud Run                │
│  - Auto-scaling enabled             │
│  - No external DB required (file)   │
│  - Health checks configured         │
└─────────────────────────────────────┘
```

## Setup Instructions

### Step 1: Create GCP Project and Artifact Registry

1. **Create a GCP Project**:
   ```bash
   gcloud projects create learning-tracker --display-name="Learning Tracker"
   gcloud config set project learning-tracker
   ```

2. **Enable Required APIs**:
   ```bash
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable iamcredentials.googleapis.com
   gcloud services enable cloudresourcemanager.googleapis.com
   gcloud services enable iam.googleapis.com
   ```

3. **Create Artifact Registry Repository**:
   ```bash
   gcloud artifacts repositories create learning-tracker \
     --repository-format=docker \
     --location=us-central1 \
     --description="Docker repository for Learning Tracker"
   ```

### Step 2: Set Up Workload Identity for GitHub Actions

1. **Create a Service Account**:
   ```bash
   gcloud iam service-accounts create github-actions-sa \
     --display-name="GitHub Actions Service Account"
   ```

2. **Grant permissions to the service account**:
   ```bash
   # Artifact Registry push
   gcloud projects add-iam-policy-binding learning-tracker \
     --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
     --role="roles/artifactregistry.writer"

   # Cloud Run deploy
   gcloud projects add-iam-policy-binding learning-tracker \
     --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
     --role="roles/run.admin"

   # IAM token creation
   gcloud projects add-iam-policy-binding learning-tracker \
     --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountTokenCreator"

   # Service Account User
   gcloud projects add-iam-policy-binding learning-tracker \
     --member="serviceAccount:github-actions-sa@learning-tracker.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

3. **Create Workload Identity Pool**:
   ```bash
   gcloud iam workload-identity-pools create "github-pool" \
     --project="learning-tracker" \
     --location="global" \
     --display-name="GitHub Actions Pool"
   ```

4. **Create Workload Identity Provider**:
   ```bash
   gcloud iam workload-identity-pools providers create-oidc "github" \
     --project="learning-tracker" \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud,assertion.repository=assertion.repository" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```

5. **Grant service account access to the Workload Identity Provider**:
   ```bash
   gcloud iam service-accounts add-iam-policy-binding github-actions-sa@learning-tracker.iam.gserviceaccount.com \
     --project="learning-tracker" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_REPO"
   ```

   Replace `PROJECT_NUMBER` with your GCP project number and `YOUR_GITHUB_REPO` with your GitHub repository (e.g., `rajeshkr2016/git`).

### Step 3: Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **`GCP_PROJECT_ID`**:
   - Value: Your GCP project ID (e.g., `learning-tracker`)

2. **`GCP_WORKLOAD_IDENTITY_PROVIDER`**:
   - Get the value:
     ```bash
     gcloud iam workload-identity-pools providers describe github \
       --project=learning-tracker \
       --location=global \
       --workload-identity-pool=github-pool \
       --format='value(name)'
     ```
   - Value: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github`

3. **`GCP_SERVICE_ACCOUNT`**:
   - Value: `github-actions-sa@learning-tracker.iam.gserviceaccount.com`

4. **`DOCKER_HUB_USERNAME`**:
   - Value: Your Docker Hub username (should already be set if using docker-build-push workflow)

5. **`DOCKER_HUB_PASSWORD`**:
   - Value: Your Docker Hub access token (should already be set if using docker-build-push workflow)

### Step 4: Verify Cloud Run Service

The workflow will automatically create a Cloud Run service on first deployment. Verify it exists:

```bash
gcloud run services list --region=us-central1
```

## Workflow Details

### File: `.github/workflows/gcp-cloudrun-deploy.yml`

**Triggers**:
- Push to `main` branch with changes in `learning/` folder
- Manual trigger (workflow_dispatch)

**Jobs**:

1. **deploy-to-cloudrun**:
   - Pulls image from Docker Hub
   - Tags it for GCP Artifact Registry
   - Pushes to Artifact Registry
   - Deploys to Cloud Run with:
     - 512MB memory, 1 CPU
     - Auto-scaling (0-10 instances)
     - File-based JSON storage (no external DB)
     - Port 8080
     - Production environment

2. **integration-tests** (runs after deployment):
   - Waits for service to be ready
   - Tests `/api/health` endpoint
   - Tests `/api/tasks` endpoint
   - Outputs service URL and details

## Running the Deployment

### Automatic Deployment

Push changes to `main`:
```bash
git push origin main
```

The workflow will:
1. Trigger automatically (if docker-build-push already pushed the image)
2. Pull image from Docker Hub
3. Push to GCP Artifact Registry
4. Deploy to Cloud Run
5. Run integration tests

### Manual Deployment

Trigger manually from GitHub:
1. Go to Actions → "Deploy to GCP Cloud Run from Docker Hub"
2. Click "Run workflow"
3. Select environment (staging or production)
4. Click "Run workflow"

## Accessing the Deployed Service

After successful deployment:

```bash
# Get the service URL
gcloud run services describe learning-tracker-app \
  --region=us-central1 \
  --format='value(status.url)'
```

Visit the URL in your browser or use curl:

```bash
# Health check
curl https://learning-tracker-app-XXXXX.run.app/api/health

# Get all tasks
curl https://learning-tracker-app-XXXXX.run.app/api/tasks

# Update task status
curl -X PUT https://learning-tracker-app-XXXXX.run.app/api/tasks/0 \
  -H "Content-Type: application/json" \
  -d '{"status": "In Progress"}'
```

## Storage Configuration

The deployed application uses **file-based JSON storage** by default:

- **Storage Path**: `/app/data/tasks.json` (Cloud Run ephemeral storage)
- **Persistence Note**: Cloud Run instances are stateless. For persistent storage across deployments, consider:

### Option 1: Use Cloud Storage (GCS)

Update the DB driver to use Google Cloud Storage:

```bash
gcloud run services update learning-tracker-app \
  --set-env-vars=DB_TYPE=gcs,GCS_BUCKET=learning-tracker-data
```

### Option 2: Use Cloud SQL

Deploy a Cloud SQL instance and use it as the backend:

```bash
gcloud run services update learning-tracker-app \
  --set-env-vars=DB_TYPE=sqlite,DB_URL=cloudsql://...
```

### Option 3: Use Firestore (NoSQL)

Deploy with Firestore as the backend:

```bash
gcloud run services update learning-tracker-app \
  --set-env-vars=DB_TYPE=firestore,FIRESTORE_COLLECTION=tasks
```

Currently, only file-based, SQLite, and MongoDB backends are implemented. Adding Cloud Storage/Firestore support would require additional driver code.

## Monitoring and Troubleshooting

### View Logs

```bash
gcloud run services logs read learning-tracker-app \
  --region=us-central1 \
  --limit=50
```

### View Metrics

```bash
gcloud monitoring time-series list \
  --filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count"'
```

### Common Issues

**Issue**: Workflow fails with "Image not found" error
- **Solution**: Ensure docker-build-push workflow has successfully pushed the image to Docker Hub before gcp-cloudrun-deploy runs.

**Issue**: Cloud Run deployment fails with permission error
- **Solution**: Verify all IAM permissions are correctly assigned to the service account (see Step 2).

**Issue**: Service returns 403 Unauthenticated
- **Solution**: The workflow uses `--allow-unauthenticated` flag. If authentication is required, remove this flag and update Cloud Run service in GCP console.

**Issue**: No persistent data across deployments
- **Solution**: Cloud Run is stateless. Implement a persistent database backend (Cloud SQL, Firestore, or Cloud Storage).

## Cost Optimization

Current configuration:

- **Memory**: 512MB (smallest available)
- **CPU**: 1 CPU
- **Min Instances**: 0 (scales down to zero when idle)
- **Max Instances**: 10
- **Timeout**: 300 seconds (5 minutes)

**Estimated Monthly Cost** (US region):
- ~$0.00 if under free tier (2M requests/month, 400,000 GB-seconds)
- ~$0.10-0.50 for light usage (scales to zero when not in use)

To reduce costs further:
```bash
gcloud run services update learning-tracker-app \
  --max-instances=5 \
  --memory=256Mi
```

## Environment Variables

The deployed service includes these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production environment |
| `DB_TYPE` | `file` | File-based JSON storage |
| `PORT` | `8080` | Cloud Run expects port 8080 |

To update environment variables:

```bash
gcloud run services update learning-tracker-app \
  --region=us-central1 \
  --set-env-vars=DB_TYPE=mongodb,MONGO_URL=mongodb+srv://...
```

## Clean Up

To remove the Cloud Run service:

```bash
gcloud run services delete learning-tracker-app --region=us-central1
```

To remove the entire GCP project:

```bash
gcloud projects delete learning-tracker
```

## Next Steps

1. **Add custom domain**: [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
2. **Enable Cloud CDN**: Cache responses for faster performance
3. **Set up Cloud Monitoring**: Alerts and dashboards
4. **Implement persistent storage**: Cloud SQL, Firestore, or Cloud Storage
5. **Add authentication**: Cloud Identity, Cloud Run authentication
6. **Enable VPC**: Network security and private Cloud Run services

## References

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions with Google Cloud](https://github.com/google-github-actions)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs)
