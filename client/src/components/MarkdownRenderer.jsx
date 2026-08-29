import ReactMarkdown from 'react-markdown';

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
          return (
            <div className="relative group my-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
                <pre className="whitespace-pre">{children}</pre>
              </div>
            </div>
          );
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
