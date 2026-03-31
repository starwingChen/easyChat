import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import type { BotMessageAction } from '../../types/bot';

interface RichTextMessageProps {
  content: string;
  onAction?: (action: BotMessageAction) => void;
}

const proseClassName =
  'rich-text-message break-words [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-current [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-current/25 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.925em] [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-3 [&_pre]:text-slate-50 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-current/15 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-current/20 [&_th]:bg-black/5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_thead]:border-b [&_thead]:border-current/20 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5';

export function RichTextMessage({ content, onAction }: RichTextMessageProps) {
  return (
    <div className={proseClassName}>
      <ReactMarkdown
        components={{
          a: ({ href, node: _node, ...props }) => {
            const isActionLink = href === 'action://open-api-config';

            return (
              <a
                {...props}
                href={href}
                onClick={(event) => {
                  if (isActionLink) {
                    event.preventDefault();
                    onAction?.('open-api-config');
                  }
                }}
                rel={isActionLink ? undefined : 'noreferrer noopener'}
                target={isActionLink ? undefined : '_blank'}
              />
            );
          },
          img: () => null,
          table: ({ node: _node, ...props }) => (
            <div className="my-3 overflow-x-auto">
              <table {...props} className="w-full min-w-max" />
            </div>
          ),
        }}
        urlTransform={(url) =>
          url.startsWith('action://') ? url : defaultUrlTransform(url)
        }
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
