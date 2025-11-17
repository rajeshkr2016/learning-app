# Learning Tracker Application

A full-stack application to track your learning progress through a 6-week intensive plan.

## Features

- Track learning tasks and progress
- Mark tasks as completed, in-progress, or pending
- RESTful API backend
- React frontend with Vite
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)

## Local Development

### Installation

Install dependencies:
```bash
npm install
```

### Running the Application

Development mode (runs both frontend and backend):
```bash
npm run dev
```

- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5001

### Building for Production

```bash
npm run build
NODE_ENV=production npm start
```

## Docker Deployment

### Build and Run with Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at http://localhost:5000

### Build and Run with Docker (Manual)

```bash
# Build the Docker image
docker build -t learning-tracker-app .

# Run the container
docker run -d \
  --name learning-tracker \
  -p 5001:5001 \
  -e NODE_ENV=production \
  learning-tracker-app

# View logs
docker logs -f learning-tracker

# Stop and remove the container
docker stop learning-tracker
docker rm learning-tracker
```

### Docker Commands Reference

```bash
# Rebuild the image (after code changes)
docker-compose up -d --build

# Check container status
docker-compose ps

# Access container shell
docker-compose exec app sh

# View real-time logs
docker-compose logs -f app

# Restart the application
docker-compose restart

# Remove containers and volumes
docker-compose down -v
```

## Project Structure

```
learning-tracker-app/
├── src/                  # React source files
├── dist/                 # Built frontend (production)
├── server.js             # Express backend server
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── Dockerfile            # Docker image definition
├── docker-compose.yml    # Docker Compose configuration
├── .dockerignore         # Docker ignore rules
├── vite.config.js        # Vite configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/tasks` - Get all tasks
- `PUT /api/tasks/:index` - Update task status
- `POST /api/tasks/init` - Initialize tasks

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5001
NODE_ENV=development
```

For production, set `NODE_ENV=production`

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Containerization**: Docker, Docker Compose

## Health Check

The Docker container includes a health check that pings the `/api/health` endpoint every 30 seconds.

Check health status:
```bash
docker inspect --format='{{.State.Health.Status}}' learning-tracker
```

## Troubleshooting

### Port already in use
If port 5000 is already in use, change it in `docker-compose.yml`:
```yaml
ports:
  - "3001:5000"  # Change 3001 to any available port
```

### Container won't start
Check the logs:
```bash
docker-compose logs app
```

### Rebuild after changes
```bash
docker-compose down
docker-compose up -d --build
```

## License

ISC
