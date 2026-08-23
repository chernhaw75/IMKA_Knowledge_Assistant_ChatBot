import ReactMarkdown, { type Components } from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import "katex/dist/katex.min.css"

/**
 * LLMs commonly write LaTeX math with \( \) / \[ \] delimiters (ChatGPT-style)
 * instead of the $ $ / $$ $$ that remark-math expects — normalize before parsing
 * so both conventions render instead of showing up as literal escaped brackets.
 */
function normalizeMathDelimiters(content: string): string {
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => `$${expr}$`)
}

const components: Components = {
  p: ({ children }) => <p className="leading-relaxed whitespace-pre-wrap">{children}</p>,
  h1: ({ children }) => <h1 className="mt-3 mb-1.5 font-display text-base font-semibold tracking-tight first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-3 mb-1.5 font-display text-[0.95rem] font-semibold tracking-tight first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-2.5 mb-1 font-display text-sm font-semibold tracking-tight first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 marker:text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:no-underline">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="border-border" />,
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "")
    if (isBlock) {
      return <code className={className}>{children}</code>
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/60 p-3 font-mono text-xs text-foreground">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/70">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-border/60 px-3 py-2 align-top text-foreground last:border-b-0">{children}</td>,
  tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm text-foreground [&>*:first-child]:mt-0 [&_.katex]:text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {normalizeMathDelimiters(content)}
      </ReactMarkdown>
    </div>
  )
}
