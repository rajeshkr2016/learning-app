#!/bin/bash
# Build and push the Learning Tracker Docker image to Docker Hub
# Usage: ./scripts/build-and-push.sh [DOCKER_HUB_USERNAME] [IMAGE_TAG]

set -e

# Configuration
DOCKER_HUB_USERNAME="${1:-rajeshkr2025}"
IMAGE_TAG="${2:-latest}"
IMAGE_NAME="learning-tracker"
REGISTRY="docker.io"

echo "🐳 Learning Tracker - Docker Build & Push Script"
echo "=================================================="
echo ""
echo "Configuration:"
echo "  Registry: $REGISTRY"
echo "  Username: $DOCKER_HUB_USERNAME"
echo "  Image: $IMAGE_NAME"
echo "  Tag: $IMAGE_TAG"
echo "  Full Image: $REGISTRY/$DOCKER_HUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build the image
echo "🔨 Building Docker image..."
docker build -t "$REGISTRY/$DOCKER_HUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG" \
             -t "$REGISTRY/$DOCKER_HUB_USERNAME/$IMAGE_NAME:latest" \
             .

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  exit 1
fi

echo ""
echo "📤 Pushing image to Docker Hub..."
docker push "$REGISTRY/$DOCKER_HUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
docker push "$REGISTRY/$DOCKER_HUB_USERNAME/$IMAGE_NAME:latest"

if [ $? -eq 0 ]; then
  echo "✅ Push successful!"
  echo ""
  echo "🎉 Done! You can now use the image with:"
  echo "  docker run -p 5001:5001 $REGISTRY/$DOCKER_HUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
  echo "  docker-compose up -d"
  echo ""
  echo "📝 Update docker-compose.yml if needed:"
  echo "  image: $REGISTRY/$DOCKER_HUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
else
  echo "❌ Push failed! Make sure you are logged in to Docker Hub:"
  echo "  docker login"
  exit 1
fi
