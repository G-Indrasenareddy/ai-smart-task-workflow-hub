import { useState, useMemo } from 'react';
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useGoals } from '../context/GoalContext';
import StatCard from '../components/StatCard';
import TaskItem from '../components/TaskItem';
import GoalProgress from '../components/GoalProgress';
import AIInsightCard from '../components/AIInsightCard';
import CreateTaskModal from '../components/CreateTaskModal';
import SuccessToast from '../components/SuccessToast';

export default function Dashboard() {
  const { tasks, createTask } = useTasks();
  const { goals } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Dynamically compute Stats Cards from shared TaskContext state
  const statsData = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const overdue = tasks.filter((t) => t.status === 'To Do').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return [
      {
        icon: ListTodo,
        label: 'Total Tasks',
        value: total.toString(),
        trend: 'Live task count',
        trendType: 'positive',
        iconBgColor: 'bg-indigo-500/10',
        iconTextColor: 'text-indigo-400',
      },
      {
        icon: CheckCircle2,
        label: 'Completed',
        value: completed.toString(),
        trend: `${completionRate}% completion rate`,
        trendType: 'positive',
        iconBgColor: 'bg-emerald-500/10',
        iconTextColor: 'text-emerald-400',
      },
      {
        icon: Clock,
        label: 'In Progress',
        value: inProgress.toString(),
        trend: 'Active work items',
        trendType: 'warning',
        iconBgColor: 'bg-amber-500/10',
        iconTextColor: 'text-amber-400',
      },
      {
        icon: AlertCircle,
        label: 'Overdue',
        value: overdue.toString(),
        trend: 'Pending action',
        trendType: 'negative',
        iconBgColor: 'bg-rose-500/10',
        iconTextColor: 'text-rose-400',
      },
    ];
  }, [tasks]);

  const handleCreateTask = (newTaskData) => {
    createTask(newTaskData);
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

      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Welcome back, Indrasena 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is your productivity overview and task status for today.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* 2. Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <StatCard key={stat.label} {...stat} />
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
              {tasks.length} Tasks
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 4).map((task) => (
              <TaskItem
                key={task.id}
                title={task.title}
                priority={task.priority}
                dueTime={task.dueDate}
                isCompleted={task.status === 'Completed'}
              />
            ))}
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
            {goals.slice(0, 3).map((goal) => (
              <GoalProgress
                key={goal.id}
                title={goal.title}
                percentage={goal.progress}
                color={goal.status === 'Completed' ? 'bg-emerald-500' : goal.status === 'At Risk' ? 'bg-amber-500' : 'bg-indigo-500'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. AI Productivity Insight */}
      <AIInsightCard />
    </div>
  );
}
