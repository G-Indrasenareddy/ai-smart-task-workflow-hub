import { Sparkles, ArrowRight } from 'lucide-react';

export default function AIInsightCard() {
  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                AI Productivity Insight
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                Recommendation
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              You complete <span className="font-semibold text-indigo-300">35% more tasks</span> when tackling high-priority items before noon. Consider prioritizing <span className="text-slate-100 font-medium">"Finalize Q3 Product Roadmap"</span> in your morning focus block today.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors shrink-0 self-start md:self-center"
        >
          <span>View Insights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
