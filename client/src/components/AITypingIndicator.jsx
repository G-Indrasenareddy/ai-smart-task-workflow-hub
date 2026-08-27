import { Sparkles } from 'lucide-react';

export default function AITypingIndicator() {
  return (
    <div className="flex gap-3 my-4 justify-start">
      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold text-slate-400 px-1">FlowMind AI</div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
