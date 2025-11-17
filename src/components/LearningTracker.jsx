import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Circle, Clock, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const LearningTracker = () => {
  // Initial start date (Nov 17, 2025)
  const [startDate, setStartDate] = useState('2025-11-17');
  
  // Initial task template without dates
  const taskTemplate = [
    // Week 1
    { week: 1, day: 1, topic: 'Arrays & Strings Basics', activities: 'Theory + 3 LeetCode Easy + DevOps Cheat Sheet 1-2', status: 'Not Started', problems: 3 },
    { week: 1, day: 2, topic: 'Hash Tables', activities: 'Theory + 3 LeetCode Easy-Medium + MongoDB review', status: 'Not Started', problems: 3 },
    { week: 1, day: 3, topic: 'Linked Lists Part 1', activities: 'Theory + 3 LeetCode Easy-Medium + DevOps Cheat Sheet 3-4', status: 'Not Started', problems: 3 },
    { week: 1, day: 4, topic: 'Linked Lists Part 2', activities: 'Theory + 3 LeetCode Medium + Document SLI/SLO', status: 'Not Started', problems: 3 },
    { week: 1, day: 5, topic: 'Stacks & Queues', activities: 'Theory + 3 LeetCode Easy-Medium + Queue concepts', status: 'Not Started', problems: 3 },
    { week: 1, day: 6, topic: 'Trees Part 1 (Weekend)', activities: 'Theory + 5 LeetCode + System Design Primer intro', status: 'Not Started', problems: 5 },
    { week: 1, day: 7, topic: 'Review & Practice (Weekend)', activities: 'Review Week 1 + 5 random problems + DDIA Ch 1', status: 'Not Started', problems: 5 },
    
    // Week 2
    { week: 2, day: 8, topic: 'Trees Part 2 (Memorial Day)', activities: 'BST Theory + 4 LeetCode Medium + DevOps Cheat Sheet 5-6', status: 'Not Started', problems: 4 },
    { week: 2, day: 9, topic: 'Tree Algorithms', activities: 'DFS/BFS + 3 LeetCode Medium + Map to log processing', status: 'Not Started', problems: 3 },
    { week: 2, day: 10, topic: 'Heaps & Priority Queues', activities: 'Theory + 3 LeetCode Medium + DevOps Cheat Sheet 7-8', status: 'Not Started', problems: 3 },
    { week: 2, day: 11, topic: 'Graphs Part 1', activities: 'DFS/BFS + 3 LeetCode Medium + Distributed systems', status: 'Not Started', problems: 3 },
    { week: 2, day: 12, topic: 'Graphs Part 2', activities: "Dijkstra's + 3 LeetCode Medium-Hard + Consul review", status: 'Not Started', problems: 3 },
    { week: 2, day: 13, topic: 'Advanced Trees (Weekend)', activities: 'Tries + 5 LeetCode + CDN/Caching study', status: 'Not Started', problems: 5 },
    { week: 2, day: 14, topic: 'Mock Interview #1 (Weekend)', activities: '45-min mock + Review all DS + DDIA Ch 2', status: 'Not Started', problems: 0 },
    
    // Week 3
    { week: 3, day: 15, topic: 'Binary Search', activities: 'Theory + 3 LeetCode Medium + DevOps Cheat Sheet 9-10', status: 'Not Started', problems: 3 },
    { week: 3, day: 16, topic: 'Two Pointers & Sliding Window', activities: 'Theory + 3 LeetCode Medium + Log optimization', status: 'Not Started', problems: 3 },
    { week: 3, day: 17, topic: 'Backtracking', activities: 'Theory + 3 LeetCode Medium + DevOps Cheat Sheet 11-12', status: 'Not Started', problems: 3 },
    { week: 3, day: 18, topic: 'Dynamic Programming Part 1', activities: 'Memoization + 3 LeetCode Easy-Medium + Capacity planning', status: 'Not Started', problems: 3 },
    { week: 3, day: 19, topic: 'Dynamic Programming Part 2', activities: '2D DP + 3 LeetCode Medium + Chaos engineering', status: 'Not Started', problems: 3 },
    { week: 3, day: 20, topic: 'Greedy Algorithms (Weekend)', activities: 'Theory + 5 LeetCode + Load balancing study', status: 'Not Started', problems: 5 },
    { week: 3, day: 21, topic: 'Mock Interview #2 (Weekend)', activities: '45-min mock + 3 Medium timed + DDIA Ch 3', status: 'Not Started', problems: 3 },
    
    // Week 4
    { week: 4, day: 22, topic: 'System Design Basics', activities: 'Scalability + Design URL shortener + Document K8s', status: 'Not Started', problems: 0 },
    { week: 4, day: 23, topic: 'Databases & Storage', activities: 'CAP theorem + Design KV store + MongoDB writeup', status: 'Not Started', problems: 0 },
    { week: 4, day: 24, topic: 'Caching & CDN', activities: 'Caching strategies + Design cache layer + 2 LC Medium', status: 'Not Started', problems: 2 },
    { week: 4, day: 25, topic: 'Message Queues & Streaming', activities: 'Kafka/Pub-sub + Design notification system + ELK mapping', status: 'Not Started', problems: 0 },
    { week: 4, day: 26, topic: 'Microservices & APIs', activities: 'REST/gRPC + Design rate limiter + Document 30+ services', status: 'Not Started', problems: 0 },
    { week: 4, day: 27, topic: 'Complex System Design (Weekend)', activities: 'Design YouTube + Design Twitter + DDIA Ch 4-5', status: 'Not Started', problems: 0 },
    { week: 4, day: 28, topic: 'System Design Mock (Weekend)', activities: '45-min system design mock + Review + DevOps Cheat Sheet 15-16', status: 'Not Started', problems: 0 },
    
    // Week 5
    { week: 5, day: 29, topic: 'Distributed Systems Concepts', activities: 'Raft/Paxos + DDIA Ch 6-7 + Consul consensus', status: 'Not Started', problems: 0 },
    { week: 5, day: 30, topic: 'Observability at Scale', activities: 'Distributed tracing + Design monitoring + ELK writeup', status: 'Not Started', problems: 0 },
    { week: 5, day: 31, topic: 'Chaos Engineering & Reliability', activities: 'Chaos principles + Review K6 toolkit + 2 LC Hard', status: 'Not Started', problems: 2 },
    { week: 5, day: 32, topic: 'Kubernetes Deep Dive', activities: 'K8s architecture + Design orchestration + K8s vs Nomad', status: 'Not Started', problems: 0 },
    { week: 5, day: 33, topic: 'CI/CD & IaC', activities: 'GitOps + Design CI/CD platform + STAR stories', status: 'Not Started', problems: 0 },
    { week: 5, day: 34, topic: 'Mixed Practice (Weekend)', activities: '3 LC Hard + Design Uber + DevOps Cheat Sheet 17-20', status: 'Not Started', problems: 3 },
    { week: 5, day: 35, topic: 'Mock Interview #3 (Weekend)', activities: 'Coding mock + System design mock + Self-review', status: 'Not Started', problems: 2 },
    
    // Week 6
    { week: 6, day: 36, topic: 'Google-Specific Prep', activities: 'DevOps Cheat Sheet 21-25 + Google tech stack + Design Search', status: 'Not Started', problems: 0 },
    { week: 6, day: 37, topic: 'Advanced Algorithms', activities: 'Bit manipulation + 4 LC Medium-Hard + Complexity review', status: 'Not Started', problems: 4 },
    { week: 6, day: 38, topic: 'Behavioral Prep', activities: 'Write STAR stories: Leadership, Conflict, Trade-offs, Failure', status: 'Not Started', problems: 0 },
    { week: 6, day: 39, topic: 'Python/Golang Deep Dive', activities: 'Concurrency + Thread-safe DS + Optimize Python tool', status: 'Not Started', problems: 0 },
    { week: 6, day: 40, topic: 'Networking & Security', activities: 'TCP/IP, DNS, SSL/TLS + Design URL crawler + Document network', status: 'Not Started', problems: 0 },
    { week: 6, day: 41, topic: 'Final Project (Weekend)', activities: 'Build: Rate limiter OR Log aggregator OR Chaos tool + GitHub', status: 'Not Started', problems: 0 },
    { week: 6, day: 42, topic: 'Mock Interview Marathon (Weekend)', activities: '2 coding (90m) + System design (60m) + Behavioral (30m)', status: 'Not Started', problems: 2 },
  ];

  const [tasks, setTasks] = useState([]);

  const [stats, setStats] = useState({
    totalProblems: 0,
    completedProblems: 0,
    notStarted: 42,
    inProgress: 0,
    completed: 0
  });

  // Calculate dates based on start date
  const calculateDates = (baseDate) => {
    const start = new Date(baseDate);
    return taskTemplate.map((task, index) => {
      const taskDate = new Date(start);
      taskDate.setDate(start.getDate() + index);
      return {
        ...task,
        date: taskDate.toISOString().split('T')[0]
      };
    });
  };

  // Initialize tasks with calculated dates
  useEffect(() => {
    // Try to fetch tasks from backend; if none, use local template and initialize backend
    const fetchOrInit = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const serverTasks = await res.json();
          if (serverTasks && serverTasks.length > 0) {
            setTasks(serverTasks);
            updateStats(serverTasks);
            return;
          }
        }
      } catch (e) {
        // network error - fall back to local template
        console.warn('Could not fetch tasks from API, using local template', e);
      }

      const tasksWithDates = calculateDates(startDate);
      setTasks(tasksWithDates);
      updateStats(tasksWithDates);

      // attempt to initialize server with these tasks
      try {
        await fetch('/api/tasks/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tasksWithDates)
        });
      } catch (e) {
        // ignore init failures
      }
    };

    fetchOrInit();
  }, [startDate]);

  // Calculate end date
  const getEndDate = () => {
    if (tasks.length === 0) return '';
    return tasks[tasks.length - 1].date;
  };

  // Format date for display
  const formatDateRange = () => {
    if (!startDate || tasks.length === 0) return '';
    const start = new Date(startDate);
    const end = new Date(getEndDate());
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const updateStatus = (index, newStatus) => {
    const newTasks = [...tasks];
    newTasks[index].status = newStatus;
    setTasks(newTasks);
    updateStats(newTasks);

    // Persist change to backend
    try {
      fetch(`/api/tasks/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(err => console.warn('Failed to persist status', err));
    } catch (e) {
      console.warn('Failed to persist status', e);
    }
  };

  const updateStats = (taskList) => {
    const completed = taskList.filter(t => t.status === 'Completed').length;
    const inProgress = taskList.filter(t => t.status === 'In Progress').length;
    const notStarted = taskList.filter(t => t.status === 'Not Started').length;
    const totalProblems = taskList.reduce((sum, t) => sum + t.problems, 0);
    const completedProblems = taskList.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.problems, 0);
    
    setStats({ totalProblems, completedProblems, notStarted, inProgress, completed });
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'bg-green-100 text-green-800';
    if (status === 'In Progress') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = ['Week', 'Day', 'Target Date', 'Topic', 'Activities', 'LeetCode Problems', 'Status'];
    const csvContent = [
      headers.join(','),
      ...tasks.map(task => [
        task.week,
        task.day,
        task.date,
        `"${task.topic}"`,
        `"${task.activities}"`,
        task.problems,
        task.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning_plan_tracker_${startDate}.csv`;
    a.click();
  };

  const exportToXLSX = () => {
    if (!tasks || tasks.length === 0) return;
    const headers = ['Week', 'Day', 'Target Date', 'Topic', 'Activities', 'LeetCode Problems', 'Status'];
    const data = tasks.map(t => ({
      Week: t.week,
      Day: t.day,
      'Target Date': t.date,
      Topic: t.topic,
      Activities: t.activities,
      'LeetCode Problems': t.problems,
      Status: t.status
    }));

    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Learning Plan');
    XLSX.writeFile(wb, `learning_plan_${startDate || 'plan'}.xlsx`);
  };

  // Load tasks from an uploaded Excel file (.xls/.xlsx)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      // Map rows to task objects
      const mapped = rawRows.map((r, idx) => {
        // Try to read common header names (case-insensitive keys)
        const get = (names) => {
          for (const n of names) {
            const key = Object.keys(r).find(k => k.toLowerCase() === n.toLowerCase());
            if (key) return r[key];
          }
          return undefined;
        };

        const week = Number(get(['week', 'Week'])) || Math.floor(idx / 7) + 1;
        const day = Number(get(['day', 'Day'])) || idx + 1;
        const topic = get(['topic', 'Topic']) || '';
        const activities = get(['activities', 'Activities']) || '';
        const problems = Number(get(['problems', 'LeetCode Problems', 'LC Problems'])) || 0;
        const status = get(['status', 'Status']) || 'Not Started';
        const dateFromFile = get(['target date', 'Target Date', 'date']);

        // If the sheet provides dates, trust them; else compute based on startDate + idx
        let date = '';
        if (dateFromFile) {
          // Normalize to YYYY-MM-DD if possible
          const parsed = new Date(dateFromFile);
          if (!isNaN(parsed)) {
            date = parsed.toISOString().split('T')[0];
          } else {
            date = dateFromFile;
          }
        }

        return { week, day, topic, activities, problems, status, date };
      });

      // If some rows have empty date, compute dates relative to startDate
      const filled = mapped.map((t, i) => {
        if (t.date && t.date !== '') return t;
        const start = new Date(startDate);
        const taskDate = new Date(start);
        taskDate.setDate(start.getDate() + i);
        return { ...t, date: taskDate.toISOString().split('T')[0] };
      });

      setTasks(filled);
      updateStats(filled);

      // Persist uploaded tasks to backend
      fetch('/api/tasks/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filled)
      }).catch(err => console.warn('Failed to initialize server tasks', err));
    };
    reader.readAsArrayBuffer(file);
    // Reset input so the same file can be re-uploaded if needed
    e.target.value = null;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Check if a date is today
  const isToday = (dateString) => {
    return dateString === getTodayDate();
  };

  // Check if a date is in the past
  const isPast = (dateString) => {
    return dateString < getTodayDate();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">6-Week Learning Plan Tracker</h1>
            <p className="text-gray-600 mt-1">{formatDateRange()}</p>
          </div>
          
          {/* Start Date Picker */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <label className="text-xs text-blue-600 font-medium block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm font-medium text-gray-900 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            
            {/* Upload Excel file */}
            <label className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg cursor-pointer">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l3 3m-3-3-3 3M12 3v9" />
              </svg>
              <span className="text-sm text-gray-700">Upload XLSX</span>
            </label>

            <button
              onClick={exportToXLSX}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              Export XLSX
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.completed}</div>
            <div className="text-sm text-blue-600">Completed</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{stats.inProgress}</div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">{stats.notStarted}</div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.completedProblems}</div>
            <div className="text-sm text-green-600">Problems Solved</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">{stats.totalProblems}</div>
            <div className="text-sm text-purple-600">Total Problems</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round((stats.completed / tasks.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(stats.completed / tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Week</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Day</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Target Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Topic</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Activities</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">LC Problems</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 transition ${
                    isToday(task.date) ? 'bg-blue-50' : 
                    isPast(task.date) && task.status === 'Not Started' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.week}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{task.day}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span className={isToday(task.date) ? 'text-blue-700 font-bold' : 'text-gray-700'}>
                        {task.date}
                      </span>
                      {isToday(task.date) && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Today</span>
                      )}
                      {isPast(task.date) && task.status === 'Not Started' && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Overdue</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.topic}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-md">{task.activities}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {task.problems > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {task.problems}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(index, e.target.value)}
                      className={`text-sm px-3 py-1 rounded-full font-medium cursor-pointer ${getStatusColor(task.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Change Start Date</strong>: Use the date picker to adjust your learning plan timeline</li>
          <li>• <strong>Today's Task</strong>: Highlighted in blue for easy identification</li>
          <li>• <strong>Overdue Tasks</strong>: Marked in red if not started and past the target date</li>
          <li>• <strong>LC Problems</strong>: Number of LeetCode problems to solve that day</li>
          <li>• <strong>Target: 150+ problems</strong> in 6 weeks (Easy: 30, Medium: 100, Hard: 20)</li>
          <li>• <strong>Mock Interviews</strong>: Days 14, 21, 35, 42 (minimum 4 mocks in 6 weeks)</li>
          <li>• <strong>System Design</strong>: Focus on Week 4 onwards</li>
          <li>• Click "Export CSV" or "Export XLSX" to save your progress for offline tracking. Use "Upload XLSX" to load a task template.</li>
        </ul>
      </div>
    </div>
  );
};

export default LearningTracker;