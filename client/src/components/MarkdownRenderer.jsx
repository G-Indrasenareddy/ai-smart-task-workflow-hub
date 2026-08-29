import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Code } from 'lucide-react';

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1].toUpperCase() : 'CODE';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group my-3.5 rounded-xl border border-slate-800 bg-slate-950 shadow-md overflow-hidden text-left">
      {/* Header with Language badge & Copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold tracking-wider text-slate-300">
          <Code className="w-3.5 h-3.5 text-indigo-400" />
          <span>{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-sans cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Content */}
      <div className="p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
        <pre className="whitespace-pre">{codeString}</pre>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-lg font-bold text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-800 tracking-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold text-slate-100 mt-3.5 mb-2 tracking-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-indigo-300 mt-3 mb-1.5 flex items-center gap-1.5">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-xs font-bold text-slate-300 mt-2.5 mb-1 uppercase tracking-wider">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="mb-2.5 leading-relaxed text-slate-200 text-sm font-normal">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1.5 mb-3 text-slate-300 text-sm pl-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1.5 mb-3 text-slate-300 text-sm pl-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-100">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-slate-300">{children}</em>
        ),
        code: ({ inline, className, children }) => {
          if (inline) {
            return (
              <code className="bg-slate-800 text-indigo-300 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-700/80">
                {children}
              </code>
            );
          }
          return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 border border-slate-800 rounded-xl bg-slate-950/60 shadow-sm">
            <table className="min-w-full divide-y divide-slate-800 text-xs text-slate-300">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-950 text-slate-400 font-semibold">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3.5 py-2.5 text-left">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3.5 py-2 border-t border-slate-800/60">{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-indigo-500 pl-3 py-1 my-2 bg-indigo-500/5 text-slate-300 text-xs italic rounded-r">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
