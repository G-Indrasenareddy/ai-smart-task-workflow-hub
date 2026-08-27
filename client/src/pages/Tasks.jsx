import { useState, useMemo } from 'react';
import { Plus, Search, Filter, ArrowUpDown, CheckCircle2, Clock, Circle, ListFilter } from 'lucide-react';
import TaskRow from '../components/TaskRow';
import CreateTaskModal from '../components/CreateTaskModal';
import SuccessToast from '../components/SuccessToast';

const initialTasksData = [
  {
    id: 1,
    title: 'Finalize Dashboard UI',
    status: 'In Progress',
    priority: 'High',
    dueDate: 'Aug 28, 2026',
  },
  {
    id: 2,
    title: 'Review React Components',
    status: 'To Do',
    priority: 'Medium',
    dueDate: 'Aug 29, 2026',
  },
  {
    id: 3,
    title: 'Design MongoDB Schema',
    status: 'To Do',
    priority: 'High',
    dueDate: 'Sep 01, 2026',
  },
  {
    id: 4,
    title: 'Implement Authentication',
    status: 'To Do',
    priority: 'High',
    dueDate: 'Sep 03, 2026',
  },
  {
    id: 5,
    title: 'Test API Endpoints',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: 'Aug 30, 2026',
  },
  {
    id: 6,
    title: 'Update Project Documentation',
    status: 'Completed',
    priority: 'Low',
    dueDate: 'Aug 26, 2026',
  },
  {
    id: 7,
    title: 'Prepare Sprint Demo',
    status: 'In Progress',
    priority: 'High',
    dueDate: 'Aug 27, 2026',
  },
  {
    id: 8,
    title: 'Review AI Integration Plan',
    status: 'Completed',
    priority: 'Low',
    dueDate: 'Aug 25, 2026',
  },
];

export default function Tasks() {
  const [tasks, setTasks] = useState(initialTasksData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Compute Task Summaries Dynamically from tasks State
  const summaries = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'To Do').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    return { total, todo, inProgress, completed };
  }, [tasks]);

  // Filter & Sort Tasks Dynamically
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'priority') {
          const weights = { High: 3, Medium: 2, Low: 1 };
          return weights[b.priority] - weights[a.priority];
        }
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy]);

  // Handle New Task Creation
  const handleCreateTask = (newTaskData) => {
    const newTask = {
      id: Date.now(),
      ...newTaskData,
    };
    setTasks((prev) => [newTask, ...prev]);
    setToastMessage('Task created successfully!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      {/* 1. Tasks Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, filter, and track your tasks in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* 2. Compact Task Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              All Tasks
            </span>
            <span className="text-xl font-bold text-slate-100 mt-0.5 block">{summaries.total}</span>
          </div>
          <div className="p-2 rounded-md bg-slate-800 text-slate-400">
            <ListFilter className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              To Do
            </span>
            <span className="text-xl font-bold text-slate-100 mt-0.5 block">{summaries.todo}</span>
          </div>
          <div className="p-2 rounded-md bg-slate-800/80 text-slate-400">
            <Circle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-xl font-bold text-blue-400 mt-0.5 block">{summaries.inProgress}</span>
          </div>
          <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{summaries.completed}</span>
          </div>
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Statuses</option>
              <option value="To Do" className="bg-slate-900">To Do</option>
              <option value="In Progress" className="bg-slate-900">In Progress</option>
              <option value="Completed" className="bg-slate-900">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Priorities</option>
              <option value="High" className="bg-slate-900">High</option>
              <option value="Medium" className="bg-slate-900">Medium</option>
              <option value="Low" className="bg-slate-900">Low</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="dueDate" className="bg-slate-900">Sort by Due Date</option>
              <option value="priority" className="bg-slate-900">Sort by Priority</option>
              <option value="title" className="bg-slate-900">Sort by Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Tasks List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No tasks match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
