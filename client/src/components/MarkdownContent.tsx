import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders AI-generated markdown content cleanly.
 * Strips raw asterisks and renders proper bold/italic/bullet formatting.
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none text-foreground ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-foreground/90 mb-2 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-foreground/90">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-foreground/90">{children}</ol>,
          li: ({ children }) => <li className="text-sm text-foreground/90 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
          ),
          hr: () => <hr className="border-border my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
