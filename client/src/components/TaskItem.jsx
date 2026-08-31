import { CheckCircle2, Circle, Clock } from 'lucide-react';

const priorityStyles = {
  High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function TaskItem({ title, priority, dueTime, isCompleted = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700/60 transition-all group w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <button
          type="button"
          aria-label={isCompleted ? "Mark task incomplete" : "Mark task complete"}
          className="text-slate-500 hover:text-indigo-400 transition-colors focus:outline-none shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
          ) : (
            <Circle className="w-5 h-5 shrink-0 group-hover:text-slate-400" />
          )}
        </button>
        <span className={`text-xs sm:text-sm font-medium truncate ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
        <span className={`px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full border ${priorityStyles[priority] || priorityStyles.Low}`}>
          {priority}
        </span>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{dueTime}</span>
        </div>
      </div>
    </div>
  );
}
