import { Sparkles, User } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatMessage({ message }) {
  const isAI = message.sender === 'ai';

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
