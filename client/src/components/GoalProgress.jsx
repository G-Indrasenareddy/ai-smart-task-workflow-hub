export default function GoalProgress({ title, percentage, color = 'bg-indigo-500' }) {
  return (
    <div className="p-3 sm:p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/60 space-y-2.5 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between text-sm gap-2">
        <span className="font-medium text-slate-200 truncate flex-1 min-w-0">{title}</span>
        <span className="font-semibold text-slate-300 font-mono text-xs shrink-0">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
