export default function StatCard({ icon: Icon, label, value, trend, trendType = 'neutral', iconBgColor = 'bg-slate-800', iconTextColor = 'text-slate-300' }) {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-sm hover:border-slate-700/80 transition-all w-full max-w-full overflow-hidden min-w-0">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate pr-1">
          {label}
        </span>
        <div className={`p-1.5 sm:p-2 rounded-lg ${iconBgColor} ${iconTextColor} shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mb-1 truncate">
        {value}
      </div>
      <div className={`text-xs font-medium truncate ${
        trendType === 'positive' ? 'text-emerald-400' :
        trendType === 'negative' ? 'text-rose-400' :
        trendType === 'warning' ? 'text-amber-400' : 'text-slate-400'
      }`}>
        {trend}
      </div>
    </div>
  );
}
