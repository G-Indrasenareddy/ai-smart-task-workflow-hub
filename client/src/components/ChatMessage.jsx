import { Sparkles, User, Plus, Check, Calendar, Flag, Trash2, Edit3, Target } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatMessage({ message, onConfirmAction, onCancelAction, isActionPending }) {
  const isAI = message.sender === 'ai';
  const action = message.action;

  return (
    <div className={`flex gap-3 my-4 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {/* AI Avatar */}
      {isAI && (
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      {/* Message Content Bubble */}
      <div className={`max-w-3xl sm:max-w-4xl space-y-1 ${isAI ? 'text-left w-full' : 'text-right'}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1 px-1">
          <span>{isAI ? 'FlowMind AI' : 'You'}</span>
          <span className="text-[10px] text-slate-500 font-mono">{message.timestamp}</span>
        </div>

        <div
          className={`p-4 rounded-xl text-sm leading-relaxed ${
            isAI
              ? 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
              : 'bg-indigo-600 text-white rounded-br-none shadow-md inline-block text-left'
          }`}
        >
          {isAI ? <MarkdownRenderer content={message.text} /> : message.text}

          {/* Interactive Proposed Action Confirmation Card: CREATE_TASK */}
          {isAI && action && action.type === 'CREATE_TASK' && action.data && (
            <div className="mt-4 bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Plus className="w-4 h-4" />
                <span>Proposed Action: Create Task</span>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
                <div className="font-semibold text-slate-100 text-sm">{action.data.title}</div>
                <div className="flex flex-wrap items-center gap-3 text-slate-400">
                  <div className="flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Priority: <strong className="text-slate-200">{action.data.priority || 'Medium'}</strong></span>
                  </div>
                  {action.data.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Due: <strong className="text-slate-200">{action.data.dueDate}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {!message.actionConfirmed ? (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onConfirmAction && onConfirmAction(message.id, action)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isActionPending ? 'Creating...' : 'Create Task'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onCancelAction && onCancelAction(message.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Task Created Successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Proposed Action Confirmation Card: UPDATE_TASK */}
          {isAI && action && action.type === 'UPDATE_TASK' && action.data && (
            <div className="mt-4 bg-slate-950/90 border border-amber-500/30 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Edit3 className="w-4 h-4" />
                <span>Proposed Action: Update Task</span>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
                <div className="text-slate-400">Target Task: <strong className="text-slate-100">{action.data.title}</strong></div>
                <div className="text-slate-300 font-semibold pt-1">Requested Changes:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {Object.entries(action.data.updates || {}).map(([key, val]) => (
                    <li key={key}><span className="capitalize">{key}</span> → <strong className="text-amber-300">{val}</strong></li>
                  ))}
                </ul>
              </div>

              {!message.actionConfirmed ? (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onConfirmAction && onConfirmAction(message.id, action)}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isActionPending ? 'Updating...' : 'Update Task'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onCancelAction && onCancelAction(message.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Task Updated Successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Proposed Action Confirmation Card: DELETE_TASK */}
          {isAI && action && action.type === 'DELETE_TASK' && action.data && (
            <div className="mt-4 bg-slate-950/90 border border-rose-500/30 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Trash2 className="w-4 h-4" />
                <span>Proposed Action: Delete Task</span>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
                <div className="font-semibold text-slate-100 text-sm">{action.data.title}</div>
              </div>

              {!message.actionConfirmed ? (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onConfirmAction && onConfirmAction(message.id, action)}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isActionPending ? 'Deleting...' : 'Delete Task'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onCancelAction && onCancelAction(message.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Task Deleted Successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Proposed Action Confirmation Card: CREATE_GOAL */}
          {isAI && action && action.type === 'CREATE_GOAL' && action.data && (
            <div className="mt-4 bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>Proposed Action: Create Goal</span>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
                <div className="font-semibold text-slate-100 text-sm">{action.data.title}</div>
                <div className="flex flex-wrap items-center gap-3 text-slate-400">
                  <div className="flex items-center gap-1">
                    <span>Target Date: <strong className="text-slate-200">{action.data.targetDate || 'N/A'}</strong></span>
                  </div>
                </div>
              </div>

              {!message.actionConfirmed ? (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onConfirmAction && onConfirmAction(message.id, action)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>{isActionPending ? 'Creating...' : 'Create Goal'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onCancelAction && onCancelAction(message.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Goal Created Successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Proposed Action Confirmation Card: UPDATE_GOAL */}
          {isAI && action && action.type === 'UPDATE_GOAL' && action.data && (
            <div className="mt-4 bg-slate-950/90 border border-amber-500/30 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Edit3 className="w-4 h-4" />
                <span>Proposed Action: Update Goal</span>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
                <div className="text-slate-400">Target Goal: <strong className="text-slate-100">{action.data.title}</strong></div>
                <div className="text-slate-300 font-semibold pt-1">Requested Changes:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {Object.entries(action.data.updates || {}).map(([key, val]) => (
                    <li key={key}><span className="capitalize">{key}</span> → <strong className="text-amber-300">{val}</strong></li>
                  ))}
                </ul>
              </div>

              {!message.actionConfirmed ? (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onConfirmAction && onConfirmAction(message.id, action)}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isActionPending ? 'Updating...' : 'Update Goal'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onCancelAction && onCancelAction(message.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Goal Updated Successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Proposed Action Confirmation Card: DELETE_GOAL */}
          {isAI && action && action.type === 'DELETE_GOAL' && action.data && (
            <div className="mt-4 bg-slate-950/90 border border-rose-500/30 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Trash2 className="w-4 h-4" />
                <span>Proposed Action: Delete Goal</span>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
                <div className="font-semibold text-slate-100 text-sm">{action.data.title}</div>
              </div>

              {!message.actionConfirmed ? (
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onConfirmAction && onConfirmAction(message.id, action)}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isActionPending ? 'Deleting...' : 'Delete Goal'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending}
                    onClick={() => onCancelAction && onCancelAction(message.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Goal Deleted Successfully!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
