'use client';

import { ModelManagerDropdown } from '@/components/model-manager-dropdown';
import { ModelSelector } from '@/components/model-selector';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type UIConversation } from '@/lib/database';
import { ChevronDown, HardDrive, Share2 } from 'lucide-react';

interface ConversationHeaderProps {
  currentConversation: UIConversation | undefined;
  isGenerating: boolean;
  onModelChange: (role: 'defender' | 'critic', provider: string, model: string) => void;
  onShare: () => void;
}

export function ConversationHeader({
  currentConversation,
  isGenerating,
  onModelChange,
  onShare,
}: ConversationHeaderProps) {
  return (
    <div className='border-b border-white/10 p-4 flex items-center justify-between flex-shrink-0'>
      {/* Left Section */}
      <div className='flex items-center gap-3 flex-1'>
        <SidebarTrigger className='text-white hover:bg-white/10' />
        <ModelManagerDropdown>
          <Button variant='ghost' size='sm' className='text-white/70 hover:text-white hover:bg-white/10'>
            <HardDrive size={16} className='mr-2' />
            Models
            <ChevronDown size={14} className='ml-1' />
          </Button>
        </ModelManagerDropdown>
      </div>

      {/* Center Section - Model Selector */}
      <div className='flex items-center justify-center flex-1'>
        <ModelSelector
          defenderModel={{
            provider: currentConversation?.defenderProvider || 'ollama',
            model: currentConversation?.defenderModel || 'phi3:3.8b',
          }}
          criticModel={{
            provider: currentConversation?.criticProvider || 'ollama',
            model: currentConversation?.criticModel || 'qwen3:8b',
          }}
          onModelChange={onModelChange}
          disabled={isGenerating}
        />
      </div>

      {/* Right Section */}
      {currentConversation && (
        <div className='flex items-center justify-end flex-1'>
          <Button
            onClick={onShare}
            variant='ghost'
            size='sm'
            className='text-white/70 hover:text-white hover:bg-white/10'
          >
            <Share2 size={16} className='mr-2' />
            Share
          </Button>
        </div>
      )}
    </div>
  );
}
