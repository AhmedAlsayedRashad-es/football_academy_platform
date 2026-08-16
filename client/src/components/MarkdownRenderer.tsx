import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <pre className="bg-muted rounded p-3 overflow-x-auto my-2">
                  <code className="text-xs text-green-700 dark:text-green-400 font-mono">{children}</code>
                </pre>
              );
            }
            return <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono text-green-700 dark:text-green-400">{children}</code>;
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
          ),
          h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mb-1 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-600 dark:hover:text-blue-300">{children}</a>
          ),
          hr: () => <hr className="border-border my-3" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border px-2 py-1 bg-muted font-semibold text-left">{children}</th>,
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

// Backward-compatible alias matching streamdown's export name
export const Streamdown = MarkdownRenderer;
