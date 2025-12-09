# Changelog

All notable changes to the Learning Tracker application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-18

### Added
- **Dynamic Start Date Picker**: Added calendar icon with date input to change project start date
- **Automatic Date Recalculation**: All 42 target dates now automatically update when start date changes
- **Today's Task Highlighting**: Current day's task is highlighted in blue with a "Today" badge
- **Overdue Task Detection**: Tasks past their target date with "Not Started" status are highlighted in red with "Overdue" badge
- **Dynamic Date Range Display**: Header now shows calculated date range (e.g., "Nov 18, 2025 - Dec 29, 2025")
- **CSV Export with Date**: Exported CSV filename now includes the start date for better organization

### Changed
- Refactored task management to use template-based date calculation
- Improved date handling with proper timezone support
- Enhanced visual feedback with color-coded task rows (blue for today, red for overdue)
- Updated component to use `useEffect` for reactive date calculations

### Fixed
- Fixed "Loading..." state getting stuck on initial render
- Fixed incorrect overdue detection showing all tasks as overdue
- Fixed date comparison logic to properly handle timezone differences
- Fixed date formatting issues causing "Invalid Date" errors
- Improved null/undefined checks for better error handling

### Technical Details
- Uses local timezone (`T00:00:00`) for consistent date comparisons
- Calculates dates sequentially (one task per day) based on start date
- Preserves task status when recalculating dates
- Optimized re-rendering with proper React hooks dependencies

## [1.0.0] - 2025-11-17

### Added
- Initial release of Learning Tracker application
- 6-week (42-day) structured learning plan
- Task tracking with three status levels: Not Started, In Progress, Completed
- Statistics dashboard showing:
  - Completed tasks count
  - In Progress tasks count
  - Not Started tasks count
  - Problems solved count
  - Total problems count
- Progress bar visualization
- CSV export functionality
- Responsive table layout with:
  - Week number
  - Day number
  - Target date
  - Topic
  - Activities
  - LeetCode problems count
  - Status selector
- Static task list covering:
  - Data structures (Arrays, Linked Lists, Trees, Graphs, etc.)
  - Algorithms (Binary Search, DP, Backtracking, etc.)
  - System Design fundamentals
  - Mock interviews
  - Behavioral preparation
- Professional UI with Tailwind CSS
- React frontend with Vite
- Express.js backend server
- Docker support with multi-stage builds
- Docker Compose configuration

### Technical Stack
- **Frontend**: React 18.2.0, Vite 5.0.8, Tailwind CSS 3.4.1
- **Backend**: Node.js, Express 4.18.2
- **Icons**: Lucide React 0.263.1
- **Containerization**: Docker, Docker Compose
- **Development**: Concurrently, Nodemon

---

## Upcoming Features (Roadmap)

### [1.2.0] - Planned
- [ ] Persistent storage with database integration
- [ ] User authentication and profiles
- [ ] Excel (.xlsx) import/export functionality
- [ ] Remarks/notes field for each task
- [ ] Task filtering and search
- [ ] Weekly/monthly view toggle
- [ ] Custom task creation and editing
- [ ] Progress analytics and charts
- [ ] Email reminders for overdue tasks
- [ ] Dark mode support

### [1.3.0] - Planned
- [ ] Mobile app (React Native)
- [ ] Collaborative learning plans (team mode)
- [ ] Integration with LeetCode API
- [ ] AI-powered study recommendations
- [ ] Pomodoro timer integration
- [ ] Study streak tracking
- [ ] Achievement badges and gamification

---

## Migration Guide

### From 1.0.0 to 1.1.0

No breaking changes. The update is backward compatible.

**What you need to know:**
1. Default start date is set to current date
2. All existing task statuses are preserved when changing start date
3. Dates are now calculated dynamically, so hardcoded dates in the template are overridden
4. CSV exports now include the start date in the filename

**To update:**
```bash
# Pull latest changes
git pull origin main

# Rebuild Docker image
docker-compose down
docker-compose up -d --build

# Or for local development
npm install
npm run build
npm start
```

---

## Bug Reports and Feature Requests

Please report bugs and request features by creating an issue in the repository.

**Bug Report Template:**
- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/Environment details
- Screenshots (if applicable)

**Feature Request Template:**
- Feature description
- Use case
- Proposed implementation (optional)
- Priority (Low/Medium/High)

---

## Contributors

- Initial development: [Your Name]
- Docker implementation: [Your Name]
- Dynamic date feature: [Your Name]

---

## License

ISC License - See LICENSE file for details
