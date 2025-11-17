# Multi-stage build for optimized production image

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# RUN npm install ##-Build is no longer reproducible -- npm install is slower -- Not recommended for production
RUN npm ci


# Copy source files
COPY . .

# Build the frontend
RUN npm run build 

# Stage 2: Production image with Node.js server
FROM node:18-bullseye-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install build tools temporarily for native modules (sqlite3) then install production deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 \
  && npm ci --only=production \
  && apt-get purge -y --auto-remove build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

# Copy server and DB drivers
COPY server.js ./
COPY db ./db
COPY .env* ./

# Copy built frontend from previous stage
COPY --from=frontend-build /app/dist ./dist

# Ensure a data directory exists and declare it as a volume for persistence
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]

# Expose port used by the app
ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server.js"]
