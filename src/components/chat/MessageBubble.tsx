import type { BotDefinition } from '../../types/bot';
import type { ChatMessage } from '../../types/message';

interface MessageBubbleProps {
  message: ChatMessage;
  botDefinition: BotDefinition;
  youLabel: string;
}

export function MessageBubble({ message, botDefinition, youLabel }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="mb-1 flex items-center gap-2 px-1">
        {!isUser ? (
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: botDefinition.themeColor }}
          />
        ) : null}
        <span className="text-xs font-medium text-slate-500">
          {isUser ? youLabel : botDefinition.name}
        </span>
      </div>
      <div
        className={`max-w-[86%] rounded-2xl px-4 py-2 text-sm leading-6 ${
          isUser
            ? 'rounded-tr-sm bg-blue-600 text-white'
            : 'rounded-tl-sm bg-slate-100 text-slate-700'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
