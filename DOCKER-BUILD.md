# Docker Build & Deployment Guide

This guide explains how to build the Learning Tracker Docker image, push it to Docker Hub, and deploy it locally with docker-compose.

## Architecture

```
Local Development
  ├── npm run dev (React + Node.js)
  └── Direct file/SQLite storage

Docker Build & Push
  ├── docker build → Creates multi-stage image
  │   ├── Stage 1: Build React frontend
  │   └── Stage 2: Production Node.js runtime
  └── docker push → Upload to docker.io/username/learning-tracker:latest

Docker Compose (Local Deployment)
  ├── Pulls pre-built image from Docker Hub
  ├── Runs app container
  ├── Optional: MongoDB service (with profile)
  ├── Persistent /app/data volume
  └── Health checks every 30s
```

## Prerequisites

- Docker Desktop (or Docker Engine)
- Docker Hub account
- Git repository cloned

## Quick Start

### 1. Build the Docker Image

```bash
# Build with default username (rajeshkr2025)
./scripts/build-and-push.sh

# Build with custom username
./scripts/build-and-push.sh your-docker-username

# Build with custom tag
./scripts/build-and-push.sh your-docker-username v1.0.0
```

**Or manually with Docker CLI:**

```bash
docker build -t docker.io/your-username/learning-tracker:latest .
```

### 2. Push to Docker Hub

```bash
# Login to Docker Hub (first time only)
docker login

# Push the image
docker push docker.io/your-username/learning-tracker:latest
```

**Or use the script (includes login check):**

```bash
./scripts/build-and-push.sh your-username latest
```

### 3. Deploy with Docker Compose

```bash
# Start the app (pulls image from Docker Hub)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop the app
docker-compose down
```

## Configuration

### Update docker-compose.yml Image Reference

If you're using a different Docker Hub username, update the image name:

```yaml
services:
  app:
    image: docker.io/YOUR-USERNAME/learning-tracker:latest
```

### Database Configuration

**File-based storage (default):**
```yaml
environment:
  - DB_TYPE=file
```

**SQLite (persistent across restarts):**
```yaml
environment:
  - DB_TYPE=sqlite
volumes:
  - app-data:/app/data  # Persists /app/data/tasks.sqlite3
```

**MongoDB (optional service):**
```bash
# Start with MongoDB
docker-compose --profile mongodb up -d
```

Then set environment:
```yaml
environment:
  - DB_TYPE=mongodb
  - MONGO_URL=mongodb://admin:password@mongo:27017
  - MONGO_DB=learning_tracker
```

## Volume Mounts

```yaml
volumes:
  - app-data:/app/data  # Persistent storage directory
```

**Location by storage type:**
- File: `/app/data/tasks.json`
- SQLite: `/app/data/tasks.sqlite3`
- MongoDB: Data in mongo-data volume

## Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker ps  # Look for "(healthy)" status
docker inspect learning-tracker-app | grep -A 5 "Health"
```

## Build Details

### Multi-Stage Build

**Stage 1: Frontend Build (node:18-alpine)**
- Installs dependencies
- Runs `npm run build`
- Outputs to `/app/dist`

**Stage 2: Production Runtime (node:18-bullseye-slim)**
- Installs build tools temporarily for native modules (sqlite3)
- Runs `npm ci --only=production`
- Removes build tools to keep image lean (~250MB)
- Copies built frontend from Stage 1
- Sets up `/app/data` volume for persistence

### Dockerfile Breakdown

```dockerfile
# Stage 1: React build
FROM node:18-alpine AS frontend-build
RUN npm ci
RUN npm run build

# Stage 2: Production runtime
FROM node:18-bullseye-slim
RUN apt-get install -y build-essential python3  # For sqlite3
RUN npm ci --only=production
RUN apt-get purge build-essential python3  # Clean up
VOLUME ["/app/data"]  # Persistence
EXPOSE 5001
CMD ["node", "server.js"]
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5001` | Server port |
| `DB_TYPE` | `file` | Storage backend (file/sqlite/mongodb) |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection URL |
| `MONGO_DB` | `learning_tracker` | MongoDB database name |

## Troubleshooting

### Image Build Fails

```bash
# Check Docker version
docker --version  # Should be 20.10+

# Check disk space
docker system df

# Clean up old images
docker system prune -a

# Rebuild without cache
docker build --no-cache -t docker.io/username/learning-tracker:latest .
```

### Push Fails

```bash
# Check Docker Hub login
docker logout && docker login

# Verify image exists
docker images | grep learning-tracker

# Check Docker Hub permissions
# Visit https://hub.docker.com/r/username/learning-tracker
```

### Container Won't Start

```bash
# Check container logs
docker-compose logs app

# Inspect container
docker inspect learning-tracker-app

# Check health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Data Not Persisting

```bash
# Check volumes
docker volume ls | grep learning

# Inspect volume
docker volume inspect learning_app-data

# Mount volume to backup
docker run -v learning_app-data:/backup -v $(pwd):/save \
  alpine tar czf /save/backup.tar.gz -C /backup .
```

## Advanced Usage

### Build with Custom Base Images

Edit `Dockerfile`:

```dockerfile
# Use different Node.js version
FROM node:20-bullseye-slim  # Instead of node:18-bullseye-slim
```

### Build for Different Architectures

```bash
# Build for ARM64 (Apple Silicon, AWS Graviton)
docker buildx build --platform linux/arm64 \
  -t docker.io/username/learning-tracker:latest .

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 \
  -t docker.io/username/learning-tracker:latest .
```

### Push to Other Registries

**GitHub Container Registry (ghcr.io):**
```bash
docker login ghcr.io
docker tag docker.io/username/learning-tracker:latest \
  ghcr.io/username/learning-tracker:latest
docker push ghcr.io/username/learning-tracker:latest
```

**Google Container Registry (gcr.io):**
```bash
docker tag docker.io/username/learning-tracker:latest \
  gcr.io/project-id/learning-tracker:latest
docker push gcr.io/project-id/learning-tracker:latest
```

## CI/CD Integration

This project includes GitHub Actions workflows:

1. **`.github/workflows/docker-build-push.yml`**
   - Triggered on push to `main`
   - Builds and pushes to Docker Hub automatically

2. **`.github/workflows/gcp-cloudrun-deploy.yml`**
   - Pulls image from Docker Hub
   - Deploys to Google Cloud Run

See `DEPLOYMENT-PIPELINE.md` for details.

## Performance Tips

1. **Layer Caching**: Dockerfile is optimized for Docker layer caching
   - Node modules installed before source copy
   - Frontend build cached separately

2. **Image Size**: Multi-stage build keeps runtime image small (~250MB)
   - Alpine used for build stage
   - Bullseye-slim for production
   - Build tools removed after compilation

3. **Start Time**: Application starts in ~1-2 seconds
   - No build step in production container
   - Pre-compiled frontend assets
   - Health check verifies availability

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (warning: removes all Docker data)
docker system prune -a --volumes
```

## Next Steps

- Deploy to production using `docker-compose` or Kubernetes
- Set up Docker Hub repository secrets for automated builds
- Configure health monitoring and alerting
- Use docker-compose.override.yml for local development modifications

For cloud deployment, see:
- `GCP-DEPLOYMENT.md` - Deploy to Google Cloud Run
- `DOCKER.md` - General Docker setup guide
