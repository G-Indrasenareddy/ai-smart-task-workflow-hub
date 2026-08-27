import { Calendar, MoreHorizontal } from 'lucide-react';
import TaskStatusBadge from './TaskStatusBadge';
import PriorityBadge from './PriorityBadge';

export default function TaskRow({ task }) {
  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group">
      {/* 1. Task Title & Code */}
      <td className="py-3.5 px-4">
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {task.title}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-0.5">
            TASK-{task.id.toString().padStart(3, '0')}
          </span>
        </div>
      </td>

      {/* 2. Status */}
      <td className="py-3.5 px-4">
        <TaskStatusBadge status={task.status} />
      </td>

      {/* 3. Priority */}
      <td className="py-3.5 px-4">
        <PriorityBadge priority={task.priority} />
      </td>

      {/* 4. Due Date */}
      <td className="py-3.5 px-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{task.dueDate}</span>
        </div>
      </td>

      {/* 5. Actions */}
      <td className="py-3.5 px-4 text-right">
        <button
          type="button"
          aria-label="Task options"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
