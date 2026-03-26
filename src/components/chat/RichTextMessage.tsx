import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface RichTextMessageProps {
  content: string;
}

const proseClassName =
  'rich-text-message break-words [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-current [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-current/25 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.925em] [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-3 [&_pre]:text-slate-50 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5';

export function RichTextMessage({ content }: RichTextMessageProps) {
  return (
    <div className={proseClassName}>
      <ReactMarkdown
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} rel="noreferrer noopener" target="_blank" />
          ),
          img: () => null,
        }}
        remarkPlugins={[remarkBreaks]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
