export default function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 pt-1">{children}</div>
    </div>
  );
}
