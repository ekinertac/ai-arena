'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  input: string;
  isGenerating: boolean;
  currentConversation?: any;
  debateFlow: 'critic-first' | 'defender-first';
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MessageInput({
  input,
  isGenerating,
  currentConversation,
  debateFlow,
  onInputChange,
  onSubmit,
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSubmit(e as any);
      }
    }
  };

  return (
    <div className='backdrop-blur-md'>
      <div className='max-w-4xl mx-auto p-4'>
        <form onSubmit={onSubmit} className='relative'>
          <div className='relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4'>
            <textarea
              className='w-full bg-transparent text-white placeholder-white/50 resize-none focus:outline-none min-h-[60px]'
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={
                !currentConversation || currentConversation.messages.length === 0
                  ? debateFlow === 'critic-first'
                    ? 'Present your idea or topic... Sage will challenge it first, then River will defend it!'
                    : 'Present your idea or topic... River will defend it first, then Sage will challenge it!'
                  : 'Respond to the AIs, add context, ask questions, or whisper to an AI (@River or @Sage)...'
              }
              rows={1}
              style={{
                height: Math.min(120, Math.max(60, input.split('\n').length * 24)) + 'px',
              }}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
            />
          </div>

          <div className='flex items-center justify-between mt-3'>
            <div className='text-xs text-white/40'>Tip: Use @River or @Sage to whisper privately to an AI</div>
            <Button
              type='submit'
              className='bg-gradient-to-r from-blue-600 to-red-600 rounded-full text-white disabled:opacity-50'
              disabled={!input.trim() || isGenerating}
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
