'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Pause, Play } from 'lucide-react';

interface DebateFlowIndicatorProps {
  debateFlow: 'critic-first' | 'defender-first';
  streamingFrom: 'defender' | 'critic' | null;
  isGenerating: boolean;
  nextAIRole: 'defender' | 'critic' | null;
  onFlowChange: () => void;
  onStop: () => void;
  onTriggerAI: (role: 'defender' | 'critic') => void;
}

export function DebateFlowIndicator({
  debateFlow,
  streamingFrom,
  isGenerating,
  nextAIRole,
  onFlowChange,
  onStop,
  onTriggerAI,
}: DebateFlowIndicatorProps) {
  return (
    <div className='mb-4 flex flex-col items-center justify-center gap-2'>
      <div className='flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 border border-white/10'>
        <div className='flex items-center gap-2'>
          <div className='text-xs text-white/60'>Debate Flow:</div>
          <button
            onClick={onFlowChange}
            className='flex items-center gap-1 hover:bg-white/10 rounded px-2 py-1 transition-colors cursor-pointer'
            disabled={isGenerating}
            title='Click to change debate flow'
          >
            {debateFlow === 'critic-first' ? (
              <>
                <span className='text-xs text-red-300 font-medium'>Sage (Critic)</span>
                <span className='text-white/40'>→</span>
                <span className='text-xs text-green-300'>River (Defender)</span>
              </>
            ) : (
              <>
                <span className='text-xs text-green-300 font-medium'>River (Defender)</span>
                <span className='text-white/40'>→</span>
                <span className='text-xs text-red-300'>Sage (Critic)</span>
              </>
            )}
            <div className='ml-2 text-xs text-white/40'>⇄</div>
          </button>
        </div>
        {isGenerating && streamingFrom && (
          <div className='flex items-center gap-2 ml-3 pl-3 border-l border-white/20'>
            <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse'></div>
            <span className='text-xs text-white/60'>
              {streamingFrom === 'critic' ? 'Sage is challenging...' : 'River is defending...'}
            </span>
          </div>
        )}

        {/* AI Control Buttons */}
        {isGenerating ? (
          /* Stop Button - Only show when generating */
          <div className='flex items-center gap-2 ml-3 pl-3 border-l border-white/20'>
            <Button
              onClick={onStop}
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-white/70 hover:text-white hover:bg-white/10'
              title='Stop current response'
            >
              <Pause size={14} className='mr-1' />
              Stop
            </Button>
          </div>
        ) : nextAIRole ? (
          /* Manual AI Trigger Buttons */
          <div className='flex items-center gap-2 ml-3 pl-3 border-l border-white/20'>
            <div className='text-xs text-white/60 mr-2'>Ready:</div>
            <Button
              onClick={() => onTriggerAI(nextAIRole)}
              variant='ghost'
              size='sm'
              className={`h-7 px-3 hover:bg-white/10 ${
                nextAIRole === 'critic' ? 'text-red-300 hover:text-red-200' : 'text-green-300 hover:text-green-200'
              }`}
              title={`Let ${nextAIRole === 'critic' ? 'Sage (Critic)' : 'River (Defender)'} respond`}
            >
              <Play size={12} className='mr-1' />
              {nextAIRole === 'critic' ? 'Sage' : 'River'}
            </Button>
          </div>
        ) : (
          /* Manual AI Selection Buttons */
          <div className='flex items-center gap-2 ml-3 pl-3 border-l border-white/20'>
            <div className='text-xs text-white/60 mr-2'>Choose AI:</div>
            <Button
              onClick={() => onTriggerAI('defender')}
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-green-300 hover:text-green-200 hover:bg-white/10'
              title='Let River (Defender) respond'
            >
              <MessageCircle size={12} className='mr-1' />
              River
            </Button>
            <Button
              onClick={() => onTriggerAI('critic')}
              variant='ghost'
              size='sm'
              className='h-7 px-2 text-red-300 hover:text-red-200 hover:bg-white/10'
              title='Let Sage (Critic) respond'
            >
              <MessageCircle size={12} className='mr-1' />
              Sage
            </Button>
          </div>
        )}
      </div>
      <div className='text-xs text-white/40'>
        {isGenerating
          ? 'AI is responding...'
          : nextAIRole
          ? `${nextAIRole === 'critic' ? 'Sage' : 'River'} should respond to your message`
          : 'Choose which AI should respond next'}
      </div>
    </div>
  );
}
