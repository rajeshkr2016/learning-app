# Learning Tracker - Docker & CI/CD Setup

## Overview

This learning tracker app is containerized and includes automated Docker image builds and pushes via GitHub Actions.

## Quick Start with Docker Compose

The app uses **file-based persistence (JSON)** by default. To run locally:

```bash
docker-compose up -d
```

Then visit `http://localhost:5001` in your browser.

### Storage Backends

The app supports three storage backends, configurable via the `DB_TYPE` environment variable:

#### 1. File-Based (Default)
```yaml
environment:
  - DB_TYPE=file
```
Tasks are persisted to `/app/data/tasks.json`. Perfect for single-instance demos.

#### 2. SQLite
```yaml
environment:
  - DB_TYPE=sqlite
```
Tasks are persisted to `/app/data/tasks.sqlite3`. Good for local testing with a real database.

#### 3. MongoDB
To use MongoDB, uncomment the MongoDB service in `docker-compose.yml` and set:
```yaml
environment:
  - DB_TYPE=mongodb
  - MONGO_URL=mongodb://mongo:27017
  - MONGO_DB=learning_tracker
```

## GitHub Actions Workflow

The `.github/workflows/docker-build-push.yml` workflow:

- **Triggers**: On every push to `main` branch (only if files in `learning/` or the workflow file change)
- **Actions**:
  1. Builds the Docker image using Dockerfile in `learning/`
  2. Pushes to Docker Hub with tags:
     - `latest` (on main branch)
     - `<sha>` (git commit SHA)
     - `main` (branch name)
  3. Caches layers for faster builds

### Setup Instructions

1. **Create Docker Hub credentials in GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add two secrets:
     - `DOCKER_HUB_USERNAME`: your Docker Hub username
     - `DOCKER_HUB_PASSWORD`: your Docker Hub access token (or password)

2. **Update the workflow** (optional):
   - Change `IMAGE_NAME` in the workflow or in `.github/workflows/docker-build-push.yml`
   - Adjust branch/path triggers as needed

3. **First run**: Push a commit to `main` and watch the workflow execute:
   ```
   GitHub → Actions → Build and Push Docker Image
   ```

### Using the Prebuilt Image

Once pushed to Docker Hub, pull and run:

```bash
docker pull <docker-hub-username>/learning-tracker:latest
docker run -d \
  -p 5001:5001 \
  -v learning-data:/app/data \
  -e DB_TYPE=file \
  <docker-hub-username>/learning-tracker:latest
```

Or with Docker Compose (after updating the image name):

```yaml
services:
  app:
    image: <docker-hub-username>/learning-tracker:latest
    ports:
      - "5001:5001"
    volumes:
      - app-data:/app/data
    environment:
      - DB_TYPE=file
```

## Dockerfile Details

- **Base**: `node:18-bullseye-slim`
- **Build Stage**: Compiles React frontend with Vite
- **Production Stage**:
  - Installs production dependencies (including optional DB drivers: mongodb, sqlite3)
  - Temporarily installs build tools to compile native modules, then removes them to keep image size small
  - Copies server, DB drivers, and built frontend
  - Creates `/app/data` volume for persistence
  - Exposes port 5001
  - Includes health check for orchestration

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `5001` | Server port |
| `DB_TYPE` | `file` | Storage backend: `file`, `sqlite`, or `mongodb` |
| `MONGO_URL` | - | MongoDB connection string (if DB_TYPE=mongodb) |
| `MONGO_DB` | `learning_tracker` | MongoDB database name (if DB_TYPE=mongodb) |

## Troubleshooting

**Image build fails**:
- Check that Docker Hub credentials are set in GitHub Secrets
- Ensure the `learning/` folder exists and contains the Dockerfile
- View workflow logs in GitHub Actions

**App doesn't start in container**:
- Check container logs: `docker logs learning-tracker-app`
- Verify port 5001 is not in use on your machine
- Ensure volume mount exists: `docker volume ls`

**Data not persisting**:
- Verify the volume mount: `docker inspect learning-tracker-app` (check Mounts)
- Check that `/app/data` is readable/writable: `docker exec learning-tracker-app ls -la /app/data`

## Local Development

To build the image locally without pushing:

```bash
cd learning
docker build -t learning-tracker:dev .
docker run -d -p 5001:5001 -v learning-data:/app/data learning-tracker:dev
```

Or use the npm scripts:

```bash
npm run dev          # Run with Vite + Node for development
npm run build        # Build React frontend
npm run start        # Run production server
npm run generate-template  # Generate sample XLSX from CSV
```
