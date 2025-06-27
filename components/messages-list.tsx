'use client';

import { ChatMessage } from '@/components/chat-message';
import { type UIMessage } from '@/lib/database';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface MessagesListProps {
  messages: UIMessage[];
  streamingFrom: 'defender' | 'critic' | null;
  streamingMessage: string;
  isGenerating: boolean;
}

export function MessagesList({ messages, streamingFrom, streamingMessage, isGenerating }: MessagesListProps) {
  const getMessageAlignmentClass = (sender: string) => {
    switch (sender) {
      case 'user':
        return 'mx-auto'; // center-aligned
      case 'critic':
        return 'ml-auto'; // right-aligned
      case 'defender':
        return 'mr-auto'; // left-aligned
      default:
        return 'mr-auto';
    }
  };

  const getMessageBubbleColor = (sender: string) => {
    switch (sender) {
      case 'user':
        return 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/20';
      case 'critic':
        return 'bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-500/20';
      case 'defender':
        return 'bg-gradient-to-r from-green-900/50 to-blue-900/50 border-green-500/20';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className='flex-1 overflow-y-auto p-4'>
      <div className='max-w-4xl mx-auto space-y-4'>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={`border rounded-lg p-4 max-w-[80%] ${getMessageAlignmentClass(
              message.sender,
            )} ${getMessageBubbleColor(message.sender)}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-sm font-medium text-white'>
                {message.sender === 'defender' && 'River (Defender)'}
                {message.sender === 'critic' && 'Sage (Critic)'}
                {message.sender === 'user' && 'Moderator'}
              </span>
              {message.isWhisper && (
                <span className='text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded'>
                  Whisper to {message.targetAI}
                </span>
              )}
            </div>
            <ChatMessage message={message} />
          </motion.div>
        ))}

        {/* Streaming message */}
        {streamingFrom && streamingMessage && (
          <motion.div
            className={`border rounded-lg p-4 max-w-[80%] ${getMessageAlignmentClass(
              streamingFrom,
            )} ${getMessageBubbleColor(streamingFrom)}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-sm font-medium text-white'>
                {streamingFrom === 'defender' && 'River (Defender)'}
                {streamingFrom === 'critic' && 'Sage (Critic)'}
              </span>
              <div className='flex space-x-1'>
                <div className='w-1 h-1 bg-white/60 rounded-full animate-pulse'></div>
                <div
                  className='w-1 h-1 bg-white/60 rounded-full animate-pulse'
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className='w-1 h-1 bg-white/60 rounded-full animate-pulse'
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
            <div className='prose prose-sm prose-invert max-w-none text-white/80'>
              <ReactMarkdown>{streamingMessage}</ReactMarkdown>
              <span className='animate-pulse'>|</span>
            </div>
          </motion.div>
        )}

        {/* Typing indicator when generating but no message yet */}
        {isGenerating && !streamingMessage && streamingFrom && (
          <motion.div
            className={`border rounded-lg p-4 max-w-[80%] ${getMessageAlignmentClass(
              streamingFrom,
            )} ${getMessageBubbleColor(streamingFrom)}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-white'>
                {streamingFrom === 'defender' && 'River (Defender)'}
                {streamingFrom === 'critic' && 'Sage (Critic)'}
              </span>
              <div className='flex space-x-1'>
                <div className='w-1 h-1 bg-white/60 rounded-full animate-pulse'></div>
                <div
                  className='w-1 h-1 bg-white/60 rounded-full animate-pulse'
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className='w-1 h-1 bg-white/60 rounded-full animate-pulse'
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
              <span className='text-white/60 text-xs'>is typing...</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
