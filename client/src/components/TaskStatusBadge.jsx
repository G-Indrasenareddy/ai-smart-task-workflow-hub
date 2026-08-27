import { Circle, Clock, CheckCircle2 } from 'lucide-react';

const statusConfigs = {
  'To Do': {
    color: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    icon: Circle,
  },
  'In Progress': {
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Clock,
  },
  'Completed': {
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
  },
};

export default function TaskStatusBadge({ status }) {
  const config = statusConfigs[status] || statusConfigs['To Do'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{status}</span>
    </span>
  );
}
