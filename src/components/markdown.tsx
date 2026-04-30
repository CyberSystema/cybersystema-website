import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

// Allowlist + safe defaults: keeps GFM features (tables, task lists,
// strikethrough), preserves heading IDs, allows safe link/image attributes.
const schema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["target"],
      ["rel"],
    ],
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), ["id"]],
  },
};

const components: Components = {
  a: ({ href, children, ...rest }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...rest}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-cyan-300 underline-offset-2 hover:underline"
      >
        {children}
      </a>
    );
  },
  h1: (props) => <h1 className="font-display text-2xl tracking-[0.12em] text-cyan-100" {...props} />,
  h2: (props) => <h2 className="font-display text-xl tracking-[0.12em] text-cyan-100" {...props} />,
  h3: (props) => <h3 className="font-display text-lg tracking-[0.12em] text-cyan-100" {...props} />,
  p: (props) => <p className="font-mono text-sm leading-relaxed text-cyan-100/85" {...props} />,
  ul: (props) => <ul className="ml-5 list-disc space-y-1 font-mono text-sm text-cyan-100/85" {...props} />,
  ol: (props) => <ol className="ml-5 list-decimal space-y-1 font-mono text-sm text-cyan-100/85" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-2 border-cyan-300/40 pl-4 font-mono text-sm italic text-cyan-100/75" {...props} />
  ),
  code: ({ className, children, ...rest }) => {
    const isBlock = typeof className === "string" && className.startsWith("language-");
    if (isBlock) {
      return (
        <code className={`${className} block`} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs text-cyan-200" {...rest}>
        {children}
      </code>
    );
  },
  pre: (props) => (
    <pre
      className="overflow-x-auto rounded-lg border border-cyan-300/20 bg-slate-950/80 p-4 font-mono text-xs text-cyan-100/90"
      {...props}
    />
  ),
  table: (props) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs text-cyan-100/85" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border-b border-cyan-300/30 px-3 py-2 text-left uppercase tracking-[0.12em]" {...props} />
  ),
  td: (props) => <td className="border-b border-cyan-300/10 px-3 py-2 align-top" {...props} />,
  hr: () => <hr className="my-4 border-cyan-300/20" />,
  img: ({ alt, ...rest }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} loading="lazy" className="max-w-full rounded-md border border-cyan-300/20" {...rest} />
  ),
};

export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className ?? ""}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
