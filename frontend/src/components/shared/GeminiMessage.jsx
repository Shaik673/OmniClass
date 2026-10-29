import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Sparkles, BookOpen, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

// HTML entity decoder and tag sanitizer
function cleanGeminiOutput(rawText) {
  if (!rawText) return '';
  let text = String(rawText);

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Convert HTML break tags to newlines
  text = text.replace(/<br\s*[\/]?>/gi, '\n');

  // Convert inline HTML formatting to Markdown equivalents if present
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');

  // Remove wrapper HTML tags that would otherwise render as raw text
  text = text.replace(/<\/?(div|p|span|section|article|header|footer)[^>]*>/gi, '');

  return text.trim();
}

// Code block with language header and copy button
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied to clipboard');
    } catch {
      toast.error('Could not copy code');
    }
  };

  const displayLang = (language || 'code').toUpperCase();

  return (
    <div className="gemini-code-card my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/90 shadow-md">
      <div className="gemini-code-header flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Terminal size={12} className="text-indigo-400" />
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[10px]"
          title="Copy code"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="gemini-code-pre p-3.5 overflow-x-auto text-xs leading-relaxed text-slate-200 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function GeminiMessage({
  content,
  sources = [],
  provider = 'gemini',
  model = 'Gemini 2.5 Flash',
  showFooter = true,
  className = '',
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const cleaned = cleanGeminiOutput(content);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(cleaned);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      toast.success('Response copied to clipboard');
    } catch {
      toast.error('Could not copy text');
    }
  };

  return (
    <div className={`gemini-message-container ${className}`}>
      <div className="gemini-markdown text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="gemini-h1 text-lg font-bold mt-4 mb-2 pb-1.5 border-b">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="gemini-h2 text-base font-bold mt-3.5 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="gemini-h3 text-sm font-semibold mt-3 mb-1.5">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="gemini-p my-2 leading-relaxed text-sm">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="gemini-ul my-2.5 pl-5 list-disc space-y-1.5 text-sm">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="gemini-ol my-2.5 pl-5 list-decimal space-y-1.5 text-sm">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="gemini-li leading-relaxed pl-1">
                {children}
              </li>
            ),
            strong: ({ children }) => (
              <strong className="gemini-strong font-semibold">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="gemini-em italic">
                {children}
              </em>
            ),
            blockquote: ({ children }) => (
              <blockquote className="gemini-blockquote my-3 pl-3.5 py-1.5 rounded-r-lg text-xs italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="gemini-table-wrapper my-3 overflow-x-auto rounded-lg">
                <table className="gemini-table w-full text-xs text-left border-collapse">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="gemini-thead">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="gemini-tbody">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="gemini-tr transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="gemini-th px-3 py-2 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="gemini-td px-3 py-2">
                {children}
              </td>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="gemini-link underline underline-offset-2 transition-colors"
              >
                {children}
              </a>
            ),
            code: ({ inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              if (!inline && (match || codeString.includes('\n'))) {
                return (
                  <CodeBlock
                    language={match ? match[1] : ''}
                    code={codeString}
                  />
                );
              }
              return (
                <code
                  className="gemini-inline-code font-mono text-[11px] px-1.5 py-0.5 rounded"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {cleaned}
        </ReactMarkdown>
      </div>

      {showFooter && (
        <div className="gemini-footer mt-3 pt-2.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="gemini-badge flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium">
              <Sparkles size={11} style={{ color: 'var(--accent)' }} />
              OmniClass Verified AI
            </span>
            {sources?.length > 0 && (
              <span className="gemini-source-indicator flex items-center gap-1" title={sources.map(s => s.title).join(', ')}>
                <BookOpen size={11} />
                {sources.length} course source{sources.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopyAll}
            className="gemini-copy-btn flex items-center gap-1 px-2.5 py-1 rounded transition-colors"
          >
            {copiedAll ? <Check size={11} style={{ color: 'var(--good)' }} /> : <Copy size={11} />}
            <span>{copiedAll ? 'Copied' : 'Copy response'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

