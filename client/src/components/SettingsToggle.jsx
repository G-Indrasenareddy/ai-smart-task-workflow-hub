export default function SettingsToggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-950/50 border border-slate-800/60">
      <div className="space-y-0.5 pr-2">
        <span className="text-sm font-medium text-slate-200 block">{label}</span>
        {description && <span className="text-xs text-slate-400 block">{description}</span>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-indigo-600' : 'bg-slate-800'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
