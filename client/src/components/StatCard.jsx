export default function StatCard({ icon: Icon, label, value, trend, trendType = 'neutral', iconBgColor = 'bg-slate-800', iconTextColor = 'text-slate-300' }) {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${iconBgColor} ${iconTextColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-100 tracking-tight mb-1">
        {value}
      </div>
      <div className={`text-xs font-medium ${
        trendType === 'positive' ? 'text-emerald-400' :
        trendType === 'negative' ? 'text-rose-400' :
        trendType === 'warning' ? 'text-amber-400' : 'text-slate-400'
      }`}>
        {trend}
      </div>
    </div>
  );
}
