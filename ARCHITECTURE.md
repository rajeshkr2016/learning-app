# Learning Tracker - Architecture Documentation

## Overview

The Learning Tracker is a full-stack web application for managing a structured 6-week learning plan. It features a React frontend, Express.js backend, pluggable storage layer, and Docker-based deployment with automated CI/CD.

> ⭐ **Default Storage**: The application uses **file-based JSON storage** by default. Tasks are persisted to `/app/data/tasks.json` with no external database dependencies. For production deployments requiring multi-instance scaling, MongoDB or SQLite can be configured via the `DB_TYPE` environment variable.

## System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  - Vite build tool                                          │
│  - React 18 + Tailwind CSS                                  │
│  - LearningTracker component                                │
│  - XLSX import/export (client-side)                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP(S) REST API
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (Express.js)                        │
│  - Node 18 runtime                                          │
│  - REST API endpoints (/api/tasks, /api/tasks/:index)       │
│  - Health check endpoint                                    │
│  - Pluggable DB abstraction layer                           │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼──┐         ┌───▼──┐        ┌────▼─────┐
    │ File │         │SQLite│        │ MongoDB  │
    │(JSON)│         │(DB)  │        │ (NoSQL)  │
    └──────┘         └──────┘        └──────────┘
```

### Component Stack

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Build tooling, component framework, hot reload |
| **Frontend** | Tailwind CSS | Utility-first CSS framework |
| **Frontend** | XLSX library | Client-side Excel import/export |
| **Backend** | Express.js | HTTP server, routing, middleware |
| **Backend** | Node.js 18 | JavaScript runtime |
| **Persistence** | File Driver | JSON-based storage (default) |
| **Persistence** | SQLite Driver | Relational database (optional) |
| **Persistence** | MongoDB Driver | NoSQL document database (optional) |
| **Container** | Docker | Image build and runtime |
| **Orchestration** | Docker Compose | Multi-service local development |
| **CI/CD** | GitHub Actions | Automated image build and push |

---

## Database Layer

### Default Database Method

The Learning Tracker uses **File-Based JSON storage** as the default database method. No external database service is required to run the application. Tasks are persisted to `/app/data/tasks.json` in a simple JSON format.

### Architecture

The app uses a **pluggable database abstraction** layer. The storage backend is selected at runtime via the `DB_TYPE` environment variable:

```javascript
// db/index.js - Selects driver based on DB_TYPE
const type = (process.env.DB_TYPE || 'file').toLowerCase();

if (type === 'mongodb') {
  driver = require('./drivers/mongodb');
} else if (type === 'sqlite') {
  driver = require('./drivers/sqlite');
} else {
  driver = require('./drivers/file');  // **DEFAULT**
}
```

**Default Behavior**: If `DB_TYPE` is not set or is set to `file`, the application will use the File-Based driver and store tasks in `/app/data/tasks.json`.

### Database Selection Matrix

| Backend | DB_TYPE Value | Environment | Dependencies | Scaling | Default |
|---------|---------------|-------------|--------------|---------|---------|
| **File (JSON)** | `file` (or unset) | Development, Demo, Single-instance | None (built-in) | ❌ Single-instance only | ✅ **YES** |
| **SQLite** | `sqlite` | Local Production, Testing | `sqlite3` npm package | ❌ Single-server | ❌ No |
| **MongoDB** | `mongodb` | Production, Cloud-native | `mongodb` npm package | ✅ Horizontally scalable | ❌ No |

### Driver Interface

All drivers implement the same interface:

```javascript
module.exports = {
  init(tasks: Task[]): Promise<boolean>,
  getAll(): Promise<Task[]>,
  updateStatus(index: number, status: string): Promise<Task | null>
};
```

### Storage Backends

#### 1. File-Based Driver (Default)

**Location**: `db/drivers/file.js`

- **Storage**: `/app/data/tasks.json`
- **Format**: JSON with wrapping object
- **Best for**: Single-instance demos, local development, minimal setup
- **Pros**: No external dependencies, simple to debug
- **Cons**: Not suitable for concurrent access, no transactions

**Data Structure**:
```json
{
  "tasks": [
    {
      "week": 1,
      "day": 1,
      "topic": "Arrays & Strings Basics",
      "activities": "Theory + 3 LeetCode Easy + SRE Book Ch 1-2",
      "status": "Not Started",
      "problems": 3,
      "date": "2025-11-17"
    }
  ]
}
```

#### 2. SQLite Driver

**Location**: `db/drivers/sqlite.js`

- **Storage**: `/app/data/tasks.sqlite3`
- **Format**: SQLite relational database
- **Best for**: Local production, single-server deployments
- **Pros**: ACID transactions, better concurrency, relational queries
- **Cons**: Larger binary (requires build tools), file-based locking

**Schema**:
```sql
CREATE TABLE tasks (
  idx INTEGER PRIMARY KEY,
  week INTEGER,
  day INTEGER,
  topic TEXT,
  activities TEXT,
  problems INTEGER,
  status TEXT,
  date TEXT
);
```

#### 3. MongoDB Driver

**Location**: `db/drivers/mongodb.js`

- **Storage**: External MongoDB service
- **Connection**: `mongodb://host:port` (configurable)
- **Database**: `learning_tracker` (default)
- **Collection**: `tasks`
- **Best for**: Multi-instance deployments, cloud environments, scaling
- **Pros**: Horizontal scaling, document-based, distributed
- **Cons**: Requires external service, network latency

**Document Structure**:
```javascript
{
  _id: ObjectId("..."),
  idx: 0,              // Used for ordering
  week: 1,
  day: 1,
  topic: "Arrays & Strings Basics",
  activities: "Theory + 3 LeetCode Easy + SRE Book Ch 1-2",
  status: "Not Started",
  problems: 3,
  date: "2025-11-17"
}
```

### Task Data Model

| Field | Type | Description |
|-------|------|-------------|
| `week` | Integer | Week number (1-6) |
| `day` | Integer | Day number (1-42) |
| `topic` | String | Learning topic/title |
| `activities` | String | Activities and resources for the day |
| `status` | String | One of: "Not Started", "In Progress", "Completed" |
| `problems` | Integer | Number of LeetCode problems to solve |
| `date` | String (YYYY-MM-DD) | Target date for the task |

---

## API Design

### REST Endpoints

#### GET /api/health
Returns server health status.

**Response** (200 OK):
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

#### GET /api/tasks
Retrieve all tasks.

**Response** (200 OK):
```json
[
  {
    "week": 1,
    "day": 1,
    "topic": "Arrays & Strings Basics",
    "activities": "Theory + 3 LeetCode Easy + SRE Book Ch 1-2",
    "status": "Not Started",
    "problems": 3,
    "date": "2025-11-17"
  },
  ...
]
```

#### POST /api/tasks/init
Initialize or replace all tasks.

**Request**:
```json
[
  {
    "week": 1,
    "day": 1,
    "topic": "Arrays & Strings Basics",
    ...
  },
  ...
]
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Tasks initialized"
}
```

#### PUT /api/tasks/:index
Update the status of a task at the given index.

**Request**:
```json
{
  "status": "In Progress"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "task": {
    "week": 1,
    "day": 1,
    "topic": "Arrays & Strings Basics",
    "activities": "Theory + 3 LeetCode Easy + SRE Book Ch 1-2",
    "status": "In Progress",
    "problems": 3,
    "date": "2025-11-17"
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Task not found"
}
```

### Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` — Success
- `404 Not Found` — Task not found
- `500 Internal Server Error` — Database or server error

The backend logs errors to console and returns a generic error message to the client.

---

## Frontend Architecture

### React Component Structure

```
App.jsx (root)
└── LearningTracker.jsx
    ├── State:
    │   ├── startDate (string)
    │   ├── tasks (Task[])
    │   ├── stats (object)
    │
    ├── Effects:
    │   └── useEffect on startDate change
    │       ├── Fetch /api/tasks
    │       ├── Fall back to local template
    │       ├── Initialize /api/tasks/init
    │
    ├── Handlers:
    │   ├── updateStatus() — PUT /api/tasks/:index
    │   ├── handleFileUpload() — Parse XLSX, POST /api/tasks/init
    │   ├── exportToCSV() — Client-side download
    │   ├── exportToXLSX() — Client-side download via XLSX lib
    │
    └── UI:
        ├── Header (date picker, export buttons, upload input)
        ├── Stats dashboard (5 cards)
        ├── Progress bar
        └── Task table (sortable by status)
```

### State Management

The component manages local state with React hooks:

```javascript
const [startDate, setStartDate] = useState('2025-11-17');
const [tasks, setTasks] = useState([]);
const [stats, setStats] = useState({ ... });
```

**Data Flow**:
1. Component mounts → fetch tasks from `/api/tasks`
2. Fall back to local template if no server data
3. Initialize server via `/api/tasks/init`
4. User changes status → update local state + PUT to `/api/tasks/:index`
5. User uploads XLSX → parse client-side + POST to `/api/tasks/init`

### Excel Import/Export

- **Import**: File input accepts `.xlsx`, `.xls` → parse with XLSX lib → map columns to task fields
- **Export CSV**: Client-side generation, download as `.csv`
- **Export XLSX**: Client-side generation via XLSX lib, download as `.xlsx`
- **Sample Template**: `task_template.csv` + `scripts/make_xlsx.js` for local XLSX generation

---

## Deployment Architecture

### Docker Build Process

**Dockerfile**: Multi-stage build

```dockerfile
# Stage 1: Build React frontend with Vite
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Output: /app/dist

# Stage 2: Production runtime
FROM node:18-bullseye-slim
WORKDIR /app
COPY package*.json ./
# Install build tools temporarily for native modules (sqlite3)
RUN apt-get update && apt-get install -y build-essential python3
RUN npm ci --only=production
# Clean up build tools to reduce image size
RUN apt-get purge -y build-essential python3 && rm -rf /var/lib/apt/lists/*

COPY server.js ./
COPY db ./db
COPY --from=frontend-build /app/dist ./dist

RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', ...)"

CMD ["node", "server.js"]
```

### Docker Compose Setup

**File**: `docker-compose.yml`

```yaml
version: '3.8'

volumes:
  app-data:        # Persistent storage for file-based DB
  mongo-data:      # MongoDB storage (optional)

services:
  app:
    build: .
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - PORT=5001
      - DB_TYPE=file              # or: sqlite, mongodb
      # - MONGO_URL=mongodb://mongo:27017
      # - MONGO_DB=learning_tracker
    volumes:
      - app-data:/app/data
    restart: unless-stopped
    healthcheck: [...]
    depends_on:
      mongo:
        condition: service_healthy

  mongo:                          # Optional MongoDB
    image: mongo:6-alpine
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck: [...]
```

### GitHub Actions CI/CD

**File**: `.github/workflows/docker-build-push.yml`

**Trigger**: Push to `main` branch (or workflow dispatch)

**Steps**:
1. Checkout code
2. Set up Docker Buildx
3. Log in to Docker Hub (using secrets: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`)
4. Extract metadata (tags: `latest`, branch name, git SHA)
5. Build and push image with layer caching

**Output**: Image pushed to Docker Hub as `<username>/learning-tracker:latest`

---

## Environment Variables

| Variable | Default | Scope | Description |
|----------|---------|-------|-------------|
| `NODE_ENV` | `production` | Server | Node.js environment |
| `PORT` | `5001` | Server | Server port |
| `DB_TYPE` | **`file`** ⭐ | Server | Storage backend: `file` (default), `sqlite`, or `mongodb`. When unset, defaults to file-based JSON storage at `/app/data/tasks.json` |
| `MONGO_URL` | `mongodb://localhost:27017` | Server | MongoDB connection URL (only used if DB_TYPE=mongodb) |
| `MONGO_DB` | `learning_tracker` | Server | MongoDB database name (only used if DB_TYPE=mongodb) |

**Note**: No additional environment variables are required to run the application with the default file-based storage. Simply omit `DB_TYPE` or set it to `file`.

---

## File Structure

```
learning/
├── src/                          # React source
│   ├── components/
│   │   └── LearningTracker.jsx   # Main component
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── db/                           # Database layer
│   ├── index.js                  # Driver selector
│   └── drivers/
│       ├── file.js               # JSON file-based
│       ├── sqlite.js             # SQLite relational
│       └── mongodb.js            # MongoDB NoSQL
│
├── scripts/
│   └── make_xlsx.js              # XLSX generator from CSV
│
├── data/                         # Runtime data (gitignored)
│   ├── tasks.json                # File-based DB
│   └── tasks.sqlite3             # SQLite DB
│
├── dist/                         # Built frontend (gitignored)
├── .github/workflows/
│   └── docker-build-push.yml     # CI/CD pipeline
│
├── Dockerfile                    # Multi-stage build
├── docker-compose.yml            # Local dev/demo stack
├── server.js                     # Express.js server
├── package.json                  # Dependencies + scripts
├── DOCKER.md                     # Docker setup guide
├── ARCHITECTURE.md               # This file
└── README.md                     # Quick start guide
```

---

## Data Flow Diagrams

### Initial Load Flow

```
User opens app
    ↓
[React] useEffect on mount
    ↓
    ├─→ GET /api/tasks
    │     ↓
    │     [Server] db.getAll()
    │     ↓
    │     [DB Driver] reads storage
    │     ↓
    │     Return tasks or []
    ↓
[React] tasks.length > 0?
    ├─→ YES: setTasks(serverTasks)
    └─→ NO: calculateDates(template) → POST /api/tasks/init → setTasks
```

### Status Update Flow

```
User changes task status in dropdown
    ↓
[React] updateStatus(index, newStatus)
    ↓
    ├─→ setTasks([...updated])  (local state)
    │
    └─→ PUT /api/tasks/:index { status: newStatus }
            ↓
            [Server] db.updateStatus(index, status)
            ↓
            [DB Driver] updates storage
            ↓
            Return updated task
```

### Excel Upload Flow

```
User selects .xlsx file
    ↓
[React] handleFileUpload(event)
    ↓
    ├─→ FileReader.readAsArrayBuffer(file)
    │     ↓
    │     XLSX.read(data)
    │     ↓
    │     sheet_to_json(worksheet)
    │     ↓
    │     Map columns to task fields
    │     ↓
    │     Calculate missing dates
    │
    ├─→ setTasks([...parsed])  (local state)
    │
    └─→ POST /api/tasks/init { tasks: [...parsed] }
            ↓
            [Server] db.init(tasks)
            ↓
            [DB Driver] overwrites storage
            ↓
            Return success
```

---

## Scalability & Future Improvements

### Current Limitations

- **Index-based API**: Uses task array index as identifier; fragile if tasks are reordered
- **No user authentication**: All tasks visible to anyone with API access
- **Single-instance**: File and SQLite drivers don't scale to multiple instances
- **No migrations**: No database schema versioning

### Recommended Improvements

1. **Add UUID-based IDs**:
   - Migrate from index-based to per-task UUIDs
   - Enables safe task reordering and partial updates
   - Update API: `/api/tasks/:id` instead of `:index`

2. **User Authentication**:
   - Add JWT or session-based auth
   - Isolate tasks per user
   - Secure API endpoints

3. **Distributed Persistence**:
   - Mandate MongoDB/SQL for multi-instance deployments
   - Add connection pooling

4. **Database Migrations**:
   - Add schema versioning (e.g., `db.migrate()`)
   - Support upgrades without data loss

5. **Observability**:
   - Add structured logging (Winston, Pino)
   - Metrics export (Prometheus)
   - Distributed tracing (OpenTelemetry)

---

## Security Considerations

### Current State

- No authentication → anyone with network access can read/modify tasks
- No rate limiting → vulnerable to brute-force/DoS
- No input validation → possible injection attacks (mitigated by JSON parsing)
- Environment secrets in plain text files (`.env`)

### Best Practices

1. **Never expose `.env` files** — Use Docker secrets or managed services (AWS Secrets Manager, etc.)
2. **Add authentication** — Implement JWT or OAuth2 before production use
3. **Enable CORS whitelisting** — Currently allows all origins
4. **Add input validation** — Validate task fields (week range 1-6, problems < 100, etc.)
5. **Use HTTPS in production** — SSL/TLS for encrypted communication
6. **Rate limiting** — Add express-rate-limit middleware
7. **Monitoring** — Log all API calls and database operations

---

## Testing Strategy

### Unit Tests (Recommended)

```
db/drivers/
├── file.test.js      # File driver read/write
├── sqlite.test.js    # SQLite CRUD operations
└── mongodb.test.js   # MongoDB connection and queries
```

### Integration Tests (Recommended)

```
api/
├── tasks.test.js     # GET, POST, PUT /api/tasks endpoints
└── health.test.js    # Health check endpoint
```

### E2E Tests (Recommended)

```
e2e/
├── upload-excel.test.js    # Excel upload flow
├── update-status.test.js   # Status change persistence
└── export-xlsx.test.js     # Export functionality
```

---

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `DB_TYPE` (file for demo, MongoDB/SQL for production)
- [ ] Set database connection strings in env (MONGO_URL, etc.)
- [ ] Create Docker Hub credentials (or alternative registry)
- [ ] Add GitHub Secrets: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`
- [ ] Test workflow: push to `main` → watch GitHub Actions → verify image in Docker Hub
- [ ] Pull image and test locally: `docker run -p 5001:5001 <image>`
- [ ] Set up persistent volume/storage for data
- [ ] Enable HTTPS (load balancer, reverse proxy, or Let's Encrypt)
- [ ] Configure monitoring/logging
- [ ] Add authentication (if multi-user)
- [ ] Document environment variables for ops team

---

## References & Resources

- **Vite Documentation**: https://vitejs.dev
- **React 18 Docs**: https://react.dev
- **Express.js Guide**: https://expressjs.com
- **SQLite Docs**: https://www.sqlite.org
- **MongoDB Manual**: https://docs.mongodb.com/manual
- **Docker Documentation**: https://docs.docker.com
- **GitHub Actions**: https://docs.github.com/en/actions
- **XLSX Library**: https://github.com/SheetJS/sheetjs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-17 | Initial architecture documentation; file/SQLite/MongoDB drivers |

---

**Last Updated**: November 17, 2025

**Maintained By**: Learning Tracker Team

**License**: ISC
