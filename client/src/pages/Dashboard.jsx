import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import StatCard from '../components/StatCard';
import TaskItem from '../components/TaskItem';
import GoalProgress from '../components/GoalProgress';
import AIInsightCard from '../components/AIInsightCard';

const statsData = [
  {
    icon: ListTodo,
    label: 'Total Tasks',
    value: '12',
    trend: '+2 added this week',
    trendType: 'positive',
    iconBgColor: 'bg-indigo-500/10',
    iconTextColor: 'text-indigo-400',
  },
  {
    icon: CheckCircle2,
    label: 'Completed',
    value: '5',
    trend: '41% completion rate',
    trendType: 'positive',
    iconBgColor: 'bg-emerald-500/10',
    iconTextColor: 'text-emerald-400',
  },
  {
    icon: Clock,
    label: 'In Progress',
    value: '4',
    trend: '2 high priority',
    trendType: 'warning',
    iconBgColor: 'bg-amber-500/10',
    iconTextColor: 'text-amber-400',
  },
  {
    icon: AlertCircle,
    label: 'Overdue',
    value: '3',
    trend: 'Requires attention',
    trendType: 'negative',
    iconBgColor: 'bg-rose-500/10',
    iconTextColor: 'text-rose-400',
  },
];

const mockTasks = [
  {
    id: 1,
    title: 'Finalize Q3 Product Roadmap',
    priority: 'High',
    dueTime: '2:00 PM',
    isCompleted: false,
  },
  {
    id: 2,
    title: 'Review Frontend Component Architecture',
    priority: 'Medium',
    dueTime: '4:30 PM',
    isCompleted: false,
  },
  {
    id: 3,
    title: 'Update API Documentation Draft',
    priority: 'Low',
    dueTime: 'Today',
    isCompleted: false,
  },
  {
    id: 4,
    title: 'Prepare Sprint Demo Slides',
    priority: 'Medium',
    dueTime: '11:00 AM',
    isCompleted: true,
  },
];

const mockGoals = [
  {
    id: 1,
    title: 'Launch FlowMind AI Beta',
    percentage: 75,
    color: 'bg-indigo-500',
  },
  {
    id: 2,
    title: 'Complete Frontend Component Library',
    percentage: 60,
    color: 'bg-emerald-500',
  },
  {
    id: 3,
    title: 'Q3 User Acquisition Campaign',
    percentage: 40,
    color: 'bg-amber-500',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
              4 Tasks
            </span>
          </div>

          <div className="space-y-2.5">
            {mockTasks.map((task) => (
              <TaskItem key={task.id} {...task} />
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
              3 Active
            </span>
          </div>

          <div className="space-y-3">
            {mockGoals.map((goal) => (
              <GoalProgress key={goal.id} {...goal} />
            ))}
          </div>
        </div>
      </div>

      {/* 4. AI Productivity Insight */}
      <AIInsightCard />
    </div>
  );
}
