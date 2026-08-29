import { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { useGoals } from '../context/GoalContext';

export default function AIInsightCard() {
  const { tasks } = useTasks();
  const { goals } = useGoals();

  const insight = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pendingHigh = tasks.find((t) => t.priority === 'High' && t.status !== 'Completed');
    const pendingAny = tasks.find((t) => t.status !== 'Completed');
    const atRiskGoal = goals.find((g) => g.status === 'At Risk');

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (atRiskGoal) {
      return {
        text: `Goal Alert: Goal "${atRiskGoal.title}" is marked 'At Risk' (${atRiskGoal.progress}% progress). Schedule a focus block to clear blockers and reach your target.`,
        targetTask: atRiskGoal.title,
      };
    }

    if (pendingHigh) {
      return {
        text: `Based on your live workspace (${completionRate}% task completion rate), your top recommended focus item is "${pendingHigh.title}" (Priority: High). Tackling high-priority tasks first maintains momentum.`,
        targetTask: pendingHigh.title,
      };
    }

    if (pendingAny) {
      return {
        text: `Your top recommended next action is "${pendingAny.title}" (Status: ${pendingAny.status}). Completing pending items will increase your productivity score.`,
        targetTask: pendingAny.title,
      };
    }

    return {
      text: `You have completed all pending tasks across ${goals.length} active goal(s)! Maintain your productivity momentum by adding new action items or defining clear milestones.`,
      targetTask: null,
    };
  }, [tasks, goals]);

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
                Live Recommendation
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {insight.text}
            </p>
          </div>
        </div>

        <Link
          to="/ai-assistant"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors shrink-0 self-start md:self-center cursor-pointer"
        >
          <span>Ask AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
