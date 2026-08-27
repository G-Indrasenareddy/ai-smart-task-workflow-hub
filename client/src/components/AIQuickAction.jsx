export default function AIQuickAction({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all group flex items-start gap-3 shadow-sm"
    >
      <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
          {title}
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </button>
  );
}
