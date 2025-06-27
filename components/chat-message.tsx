import { type UIMessage } from '@/lib/database';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const content = message.content || '';

  return (
    <div className='prose prose-sm prose-invert max-w-none text-white/90'>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
