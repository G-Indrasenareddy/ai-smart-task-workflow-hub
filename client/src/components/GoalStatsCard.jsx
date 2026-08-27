export default function GoalStatsCard({ label, value, icon: Icon, iconBgColor = 'bg-slate-800', iconTextColor = 'text-slate-300' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between shadow-sm">
      <div>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-xl font-bold text-slate-100 mt-0.5 block">{value}</span>
      </div>
      <div className={`p-2 rounded-md ${iconBgColor} ${iconTextColor}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}
