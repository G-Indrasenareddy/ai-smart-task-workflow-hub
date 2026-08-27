export default function SettingsSelect({ label, description, value, options, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/60">
      <div className="space-y-0.5">
        <label className="text-sm font-medium text-slate-200 block">{label}</label>
        {description && <span className="text-xs text-slate-400 block">{description}</span>}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer shrink-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
