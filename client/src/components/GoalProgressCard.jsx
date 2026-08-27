import { Calendar, CheckSquare } from 'lucide-react';
import GoalStatusBadge from './GoalStatusBadge';
import ActionDropdownMenu from './ActionDropdownMenu';

export default function GoalProgressCard({ goal, onEdit, onDelete }) {
  const getProgressBarColor = (status) => {
    if (status === 'Completed') return 'bg-emerald-500';
    if (status === 'At Risk') return 'bg-rose-500';
    return 'bg-indigo-500';
  };

  return (
    <div className="bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 group">
      {/* Top Bar: Title & Status */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-slate-100 text-base leading-snug group-hover:text-indigo-300 transition-colors">
            {goal.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <GoalStatusBadge status={goal.status} />
            <ActionDropdownMenu
              onEdit={() => onEdit && onEdit(goal)}
              onDelete={() => onDelete && onDelete(goal)}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {goal.description}
        </p>
      </div>

      {/* Progress Bar Section */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Progress</span>
          <span className="font-semibold text-slate-200 font-mono">{goal.progress}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(goal.status)}`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* Footer Info: Target Date & Related Tasks */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{goal.targetDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
          <span>{goal.tasksCount} Tasks</span>
        </div>
      </div>
    </div>
  );
}
