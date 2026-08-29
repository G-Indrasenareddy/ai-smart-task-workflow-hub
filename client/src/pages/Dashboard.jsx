import { useState, useMemo } from 'react';
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useGoals } from '../context/GoalContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import TaskItem from '../components/TaskItem';
import GoalProgress from '../components/GoalProgress';
import AIInsightCard from '../components/AIInsightCard';
import CreateTaskModal from '../components/CreateTaskModal';
import SuccessToast from '../components/SuccessToast';

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isTaskOverdue(task) {
  if (!task || task.status === 'Completed') return false;
  if (!task.dueDate) return false;
  const lower = task.dueDate.trim().toLowerCase();
  if (lower === 'today' || lower === 'tomorrow') return false;

  const todayStr = getLocalDateString(new Date());

  // ISO date YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate.trim())) {
    return task.dueDate.trim() < todayStr;
  }

  // Handle standard date strings like "September 5, 2026"
  const dateObj = new Date(task.dueDate);
  if (!isNaN(dateObj.getTime())) {
    const taskDateStr = getLocalDateString(dateObj);
    return taskDateStr < todayStr;
  }

  return false;
}

function isTaskDueToday(task) {
  if (!task) return false;
  if (!task.dueDate) return false;
  const lower = task.dueDate.trim().toLowerCase();
  if (lower === 'today') return true;

  const todayStr = getLocalDateString(new Date());

  // ISO date YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate.trim())) {
    return task.dueDate.trim() === todayStr;
  }

  // Handle standard date strings
  const dateObj = new Date(task.dueDate);
  if (!isNaN(dateObj.getTime())) {
    const taskDateStr = getLocalDateString(dateObj);
    return taskDateStr === todayStr;
  }

  return false;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, createTask } = useTasks();
  const { goals } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Dynamically compute Stat Cards from shared TaskContext state with clear labels & correct calculations
  const statsData = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const overdueCount = tasks.filter(isTaskOverdue).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return [
      {
        id: 'total',
        label: 'Total Tasks',
        value: total,
        trend: `${completed} of ${total} completed (${completionRate}%)`,
        trendType: 'positive',
        icon: ListTodo,
        iconBgColor: 'bg-indigo-600/20',
        iconTextColor: 'text-indigo-400',
      },
      {
        id: 'completed',
        label: 'Completed Tasks',
        value: completed,
        trend: `${completionRate}% task completion rate`,
        trendType: 'positive',
        icon: CheckCircle2,
        iconBgColor: 'bg-emerald-500/20',
        iconTextColor: 'text-emerald-400',
      },
      {
        id: 'inProgress',
        label: 'In Progress',
        value: inProgress,
        trend: `${inProgress} active task(s) in flight`,
        trendType: 'warning',
        icon: Clock,
        iconBgColor: 'bg-amber-500/20',
        iconTextColor: 'text-amber-400',
      },
      {
        id: 'overdue',
        label: 'Overdue Tasks',
        value: overdueCount,
        trend: overdueCount > 0 ? `${overdueCount} task(s) past due date` : 'No overdue tasks',
        trendType: overdueCount > 0 ? 'negative' : 'positive',
        icon: AlertCircle,
        iconBgColor: overdueCount > 0 ? 'bg-rose-500/20' : 'bg-slate-800',
        iconTextColor: overdueCount > 0 ? 'text-rose-400' : 'text-slate-400',
      },
    ];
  }, [tasks]);

  // Dynamically filter tasks actually due today
  const todaysTasks = useMemo(() => {
    return tasks.filter(isTaskDueToday);
  }, [tasks]);

  // Dynamically derive active goals (top 3)
  const activeGoals = useMemo(() => {
    return goals.slice(0, 3);
  }, [goals]);

  const handleCreateTask = async (newTaskData) => {
    try {
      const created = await createTask(newTaskData);
      setToastMessage(`Task "${created.title}" created successfully!`);
    } catch (err) {
      console.error('Failed to create task on Dashboard:', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6">
      {/* Toast Notification */}
      <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Welcome back, {user?.name || 'User'} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is your productivity overview and task status for today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* 2. Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* 3. Main Content Grid (Two Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Tasks (2 spans on lg) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-slate-100">
                Today's Tasks
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-full">
              {todaysTasks.length} Due Today
            </span>
          </div>

          <div className="space-y-2.5">
            {todaysTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No tasks due today. You're all caught up for today!
              </div>
            ) : (
              todaysTasks.map((task) => (
                <TaskItem
                  key={task.id || task._id}
                  title={task.title}
                  priority={task.priority}
                  dueTime={task.dueDate}
                  isCompleted={task.status === 'Completed'}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Goal Progress (1 span on lg) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-semibold text-slate-100">
              Goal Progress
            </h2>
            <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-full">
              {goals.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {goals.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No active goals created yet.
              </div>
            ) : (
              activeGoals.map((goal) => (
                <GoalProgress
                  key={goal.id || goal._id}
                  title={goal.title}
                  percentage={goal.progress}
                  color={
                    goal.status === 'Completed'
                      ? 'bg-emerald-500'
                      : goal.status === 'At Risk'
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. AI Productivity Insight */}
      <AIInsightCard />
    </div>
  );
}
