import { Calendar } from 'lucide-react';
import TaskStatusBadge from './TaskStatusBadge';
import PriorityBadge from './PriorityBadge';
import ActionDropdownMenu from './ActionDropdownMenu';

export default function TaskRow({ task, onEdit, onDelete, onToggleStatus }) {
  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group">
      {/* 1. Task Title & Code */}
      <td className="py-3.5 px-4">
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {task.title}
          </span>
          {task.description && (
            <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</span>
          )}
          <span className="text-[11px] font-mono text-slate-500 mt-0.5">
            TASK-{task.id.toString().padStart(3, '0')}
          </span>
        </div>
      </td>

      {/* 2. Status (Clickable to toggle status) */}
      <td className="py-3.5 px-4">
        <button
          type="button"
          onClick={() => onToggleStatus && onToggleStatus(task)}
          className="focus:outline-none hover:opacity-80 transition-opacity"
          title="Click to toggle status"
        >
          <TaskStatusBadge status={task.status} />
        </button>
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

      {/* 5. Actions Dropdown */}
      <td className="py-3.5 px-4 text-right">
        <ActionDropdownMenu
          onEdit={() => onEdit && onEdit(task)}
          onDelete={() => onDelete && onDelete(task)}
        />
      </td>
    </tr>
  );
}
