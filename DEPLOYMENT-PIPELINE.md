# Deployment Pipeline Summary

## Overview

The Learning Tracker now supports multiple deployment pipelines:

1. **Docker Hub** (docker-build-push.yml) — Builds and pushes image to Docker Hub
2. **GCP Cloud Run** (gcp-cloudrun-deploy.yml) — Deploys to Google Cloud Run

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Push to main branch                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   Docker Hub                        GCP Cloud Run
   (docker-build-push.yml)          (gcp-cloudrun-deploy.yml)
        │                                 │
        │ Build & Push                    │ Pull from Docker Hub
        │ to Docker Hub                   │ Tag for Artifact Registry
        │                                 │ Push to Artifact Registry
        │                                 │ Deploy to Cloud Run
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
              ✅ Both services running:
              - Docker Hub image ready for manual pulling
              - Cloud Run instance auto-scaled and serving traffic
```

## Workflows

### 1. Docker Build & Push (docker-build-push.yml)

**Purpose**: Build and push image to Docker Hub registry

**Triggers**:
- Push to `main` branch (all files)
- Manual trigger

**Actions**:
- Build multi-stage Docker image
- Push to Docker Hub with tags: `latest`, `main`, git SHA

**Output**: Docker Hub image `docker.io/username/learning-tracker:latest`

### 2. GCP Cloud Run Deploy (gcp-cloudrun-deploy.yml)

**Purpose**: Deploy to Google Cloud Run using Docker Hub image

**Triggers**:
- Push to `main` branch (changes in `learning/` folder)
- Manual trigger (with staging/production selection)

**Actions**:
1. Pull image from Docker Hub
2. Tag for GCP Artifact Registry
3. Push to Artifact Registry
4. Deploy to Cloud Run
5. Run integration tests

**Output**: Cloud Run service endpoint (e.g., `https://learning-tracker-app-xxxxx.run.app`)

## GitHub Secrets Required

```
DOCKER_HUB_USERNAME         # For docker-build-push
DOCKER_HUB_PASSWORD         # For docker-build-push

GCP_PROJECT_ID              # For gcp-cloudrun-deploy
GCP_WORKLOAD_IDENTITY_PROVIDER  # For gcp-cloudrun-deploy
GCP_SERVICE_ACCOUNT         # For gcp-cloudrun-deploy
```

## Key Features

### Docker Hub Pipeline
✅ No external dependencies — self-contained build
✅ Works with any Docker registry
✅ Suitable for Docker Compose or manual deployments
✅ Public/private image options

### GCP Cloud Run Pipeline
✅ Serverless auto-scaling (0-10 instances)
✅ Fully managed — no infrastructure to maintain
✅ Built-in monitoring, logging, health checks
✅ Low cost (~$0 under free tier, ~$0.10-0.50/month for light usage)
✅ File-based storage (ephemeral — use Cloud SQL/Firestore for persistence)
✅ Health check and smoke tests included
✅ Environment configuration built-in

## Deployment Instructions

### Setup Docker Hub (One-time)

1. Create Docker Hub account
2. Add secrets to GitHub:
   - `DOCKER_HUB_USERNAME`
   - `DOCKER_HUB_PASSWORD` (access token)

### Setup GCP (One-time)

See [GCP-DEPLOYMENT.md](./GCP-DEPLOYMENT.md) for detailed setup instructions.

Quick summary:
1. Create GCP project
2. Enable required APIs
3. Create Artifact Registry repository
4. Set up Workload Identity for GitHub Actions
5. Add GCP secrets to GitHub

### Deploy

**Automatic** (on push to main):
```bash
git push origin main
# Both workflows trigger automatically
```

**Manual** (from GitHub UI):
1. Go to Actions
2. Select workflow ("Build and Push Docker Image" or "Deploy to GCP Cloud Run from Docker Hub")
3. Click "Run workflow"

## Accessing Deployed Service

### Docker Hub

Pull and run locally:
```bash
docker pull username/learning-tracker:latest
docker run -p 5001:5001 username/learning-tracker:latest
```

### GCP Cloud Run

Get service URL:
```bash
gcloud run services describe learning-tracker-app \
  --region=us-central1 \
  --format='value(status.url)'
```

Access API:
```bash
curl https://learning-tracker-app-xxxxx.run.app/api/health
curl https://learning-tracker-app-xxxxx.run.app/api/tasks
```

## Storage Configuration

### File-Based (Default)
- No setup required
- Tasks stored in `/app/data/tasks.json`
- Ephemeral on Cloud Run (data lost on redeploy)
- Persistent with Docker volumes

### Optional: Switch to MongoDB
```bash
gcloud run services update learning-tracker-app \
  --set-env-vars=DB_TYPE=mongodb,MONGO_URL=mongodb://...
```

### Optional: Switch to SQLite
```bash
gcloud run services update learning-tracker-app \
  --set-env-vars=DB_TYPE=sqlite
```

## Files

| File | Purpose |
|------|---------|
| `.github/workflows/docker-build-push.yml` | Build and push to Docker Hub |
| `.github/workflows/gcp-cloudrun-deploy.yml` | Deploy to GCP Cloud Run |
| `GCP-DEPLOYMENT.md` | Detailed GCP setup guide |
| `DOCKER.md` | Docker deployment guide |
| `ARCHITECTURE.md` | System architecture |
| `README.md` | Quick start guide |

## Monitoring

### GCP Cloud Run Logs
```bash
gcloud run services logs read learning-tracker-app --limit=50
```

### Health Check
```bash
curl https://learning-tracker-app-xxxxx.run.app/api/health
```

### Deployment Status
View in GitHub Actions tab → gcp-cloudrun-deploy workflow

## Cost Estimates

### GCP Cloud Run
- **Free tier**: 2M requests/month, 400,000 GB-seconds
- **Light usage**: $0.10-0.50/month (scales to zero when idle)
- **Heavy usage**: ~$2-10/month depending on traffic

### Docker Hub
- **Free tier**: Unlimited public images

## Next Steps

1. ✅ Create GitHub secrets (GCP + Docker Hub)
2. ✅ Set up GCP Workload Identity
3. ✅ Test manual deployment
4. ✅ Set up monitoring/alerts
5. ✅ Configure persistent storage (if needed)
6. ✅ Add custom domain (optional)

## Troubleshooting

### Workflow fails with "secrets not found"
- Verify all required secrets are added to GitHub Settings → Secrets and variables

### GCP deployment permission denied
- Check IAM roles on service account (Step 2 of GCP-DEPLOYMENT.md)

### Cloud Run service not responding
- Check logs: `gcloud run services logs read learning-tracker-app`
- Verify service is deployed: `gcloud run services list`

### Docker Hub image not found
- Ensure docker-build-push.yml runs successfully first
- Check Docker Hub repository exists and image is tagged correctly

For more details, see:
- [GCP-DEPLOYMENT.md](./GCP-DEPLOYMENT.md) — GCP setup and configuration
- [DOCKER.md](./DOCKER.md) — Docker deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and architecture
