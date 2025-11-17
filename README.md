# Learning Tracker Application

A full-stack application to track your learning progress through a 6-week intensive plan. It features a React frontend, Express.js backend, and pluggable storage layer with file-based persistence by default.

## 🎯 Quick Start

**Default Setup**: No external database required — tasks are stored locally in JSON format.

```bash
# Install and run
npm install
npm run dev

# Visit http://localhost:5173 (frontend) or http://localhost:5001 (API)
```

Or with Docker:
```bash
docker-compose up -d
# Visit http://localhost:5001
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  - Vite build tool, React 18, Tailwind CSS                 │
│  - XLSX import/export (client-side)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP(S) REST API
┌────────────────────────▼────────────────────────────────────┐
│                 Backend (Express.js + Node 18)               │
│  - REST API endpoints (/api/tasks, health checks)           │
│  - Pluggable DB abstraction layer                           │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼──────┐     ┌───▼──┐        ┌────▼─────┐
    │   File   │     │SQLite│        │ MongoDB  │
    │  (JSON)  │     │(DB)  │        │ (NoSQL)  │
    │ Default  │     │(Opt) │        │ (Opt)    │
    └──────────┘     └──────┘        └──────────┘
    /app/data/      /app/data/      External
   tasks.json    tasks.sqlite3      Service
```

### Default Storage: File-Based JSON ⭐

The application uses **file-based JSON storage** by default with **zero external dependencies**:

- **Storage Location**: `/app/data/tasks.json`
- **Setup Required**: None — it just works
- **Best For**: Development, demos, single-instance deployments
- **Scaling**: Alternative backends available (SQLite, MongoDB)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design and scalability options.

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
├── src/                     # React source files
│   ├── components/
│   │   └── LearningTracker.jsx    # Main tracker component
│   └── App.jsx
│
├── db/                      # Database abstraction layer
│   ├── index.js             # Driver selector
│   └── drivers/
│       ├── file.js          # JSON file-based (default)
│       ├── sqlite.js        # SQLite relational (optional)
│       └── mongodb.js       # MongoDB NoSQL (optional)
│
├── data/                    # Runtime storage (gitignored)
│   └── tasks.json           # Task data (file-based backend)
│
├── dist/                    # Built frontend (production)
├── server.js                # Express backend server
├── package.json             # Dependencies and scripts
├── Dockerfile               # Docker image definition
├── docker-compose.yml       # Docker Compose configuration
├── ARCHITECTURE.md          # Detailed system design
├── DOCKER.md                # Docker deployment guide
└── README.md                # This file
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/tasks` - Get all tasks
- `PUT /api/tasks/:index` - Update task status
- `POST /api/tasks/init` - Initialize tasks

## Environment Variables

### Default Configuration (No Setup Needed)

Out of the box, the app uses file-based JSON storage. Just run it:

```bash
npm run dev
# or
docker-compose up -d
```

### Optional: Configure Storage Backend

Create a `.env` file or set environment variables to choose a database backend:

```env
# Default (file-based JSON) - no setup required
PORT=5001
NODE_ENV=development
DB_TYPE=file

# Optional: Use SQLite
# DB_TYPE=sqlite

# Optional: Use MongoDB
# DB_TYPE=mongodb
# MONGO_URL=mongodb://localhost:27017
# MONGO_DB=learning_tracker
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Server port |
| `NODE_ENV` | `development` | Node environment |
| `DB_TYPE` | **`file`** | Storage backend: `file` (JSON), `sqlite`, or `mongodb` |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB URL (only if `DB_TYPE=mongodb`) |
| `MONGO_DB` | `learning_tracker` | MongoDB database name (only if `DB_TYPE=mongodb`) |

See [DOCKER.md](./DOCKER.md) for database-specific deployment instructions.

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, XLSX
- **Backend**: Node.js 18, Express.js
- **Storage**: File (JSON) by default; SQLite or MongoDB optional
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions (automated image builds)

## Storage & Persistence

### File-Based (Default) ✅ Recommended

No setup required. Tasks stored in `/app/data/tasks.json`:

```bash
npm run dev
# or
docker-compose up
```

### SQLite (Optional)

For local production or testing:

```bash
DB_TYPE=sqlite npm run dev
```

Data persists in `/app/data/tasks.sqlite3`

### MongoDB (Optional)

For cloud deployments and scaling:

```bash
DB_TYPE=mongodb MONGO_URL=mongodb://localhost:27017 npm run dev
```

Or use the provided MongoDB service in Docker Compose:

```bash
# Edit docker-compose.yml and uncomment the mongo service
docker-compose up
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed storage backend comparison and [DOCKER.md](./DOCKER.md) for deployment examples.

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
