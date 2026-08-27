const statusStyles = {
  Active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'At Risk': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function GoalStatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.Active;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
}
