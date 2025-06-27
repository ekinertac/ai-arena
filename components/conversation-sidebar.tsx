'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type UIConversation } from '@/lib/database';
import { MessageSquare, Plus, Search, Swords, Trash2, User } from 'lucide-react';

interface ConversationSidebarProps {
  conversations: UIConversation[];
  currentConversationId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNewConversation: (type: 'mixed' | 'same' | 'collab') => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string, e: React.MouseEvent) => void;
}

interface GroupedSessions {
  today: UIConversation[];
  yesterday: UIConversation[];
  lastWeek: UIConversation[];
  older: UIConversation[];
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  searchQuery,
  onSearchChange,
  onCreateNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  const groupSessionsByTime = (): GroupedSessions => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return conversations.reduce(
      (groups: GroupedSessions, conversation: UIConversation) => {
        const conversationDate = new Date(conversation.createdAt);
        if (conversationDate >= today) {
          groups.today.push(conversation);
        } else if (conversationDate >= yesterday) {
          groups.yesterday.push(conversation);
        } else if (conversationDate >= lastWeek) {
          groups.lastWeek.push(conversation);
        } else {
          groups.older.push(conversation);
        }
        return groups;
      },
      { today: [], yesterday: [], lastWeek: [], older: [] } as GroupedSessions,
    );
  };

  const groupedSessions = groupSessionsByTime();

  return (
    <Sidebar className='border-r border-white/10 bg-black/95 backdrop-blur-md [&>*]:bg-transparent'>
      <SidebarHeader className='border-b border-white/10 p-4 bg-transparent'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center'>
            <Swords size={16} className='text-white' />
          </div>
          <h2 className='font-bold text-white'>AI Arena</h2>
        </div>
        <div className='space-y-2 mb-3'>
          <Button
            onClick={() => onCreateNewConversation('mixed')}
            className='w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white border-0'
          >
            <Plus size={16} className='mr-2' />
            New Conversation
          </Button>

          <div className='grid grid-cols-2 gap-2'>
            <Button
              onClick={() => onCreateNewConversation('same')}
              variant='outline'
              className='text-xs border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent'
            >
              Same Model
            </Button>
            <Button
              onClick={() => onCreateNewConversation('collab')}
              variant='outline'
              className='text-xs border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent'
            >
              Collaborate
            </Button>
          </div>
        </div>
        <div className='relative'>
          <Search size={16} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50' />
          <Input
            placeholder='Search conversations...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-500'
          />
        </div>
      </SidebarHeader>

      <SidebarContent className='bg-transparent [&>*]:bg-transparent'>
        {Object.entries(groupedSessions).map(([period, periodSessions]) => {
          if (periodSessions.length === 0) return null;

          const periodLabels = {
            today: 'Today',
            yesterday: 'Yesterday',
            lastWeek: 'Last 7 Days',
            older: 'Older',
          };

          return (
            <SidebarGroup key={period}>
              <SidebarGroupLabel className='text-white/70 px-2'>
                {periodLabels[period as keyof typeof periodLabels]}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {periodSessions.map((conversation: UIConversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <div className='group relative flex items-center w-full'>
                        <SidebarMenuButton
                          onClick={() => onSelectConversation(conversation.id)}
                          isActive={currentConversationId === conversation.id}
                          className='flex-1 text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-blue-600/20 data-[active=true]:text-white pr-8'
                        >
                          <div className='flex items-center gap-2'>
                            <MessageSquare size={16} />
                          </div>
                          <span className='truncate'>{conversation.title}</span>
                        </SidebarMenuButton>
                        <button
                          onClick={(e) => onDeleteConversation(conversation.id, e)}
                          className='absolute right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded z-10'
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className='border-t border-white/10 p-4 bg-transparent'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center'>
            <User size={16} className='text-white' />
          </div>
          <div className='flex-1'>
            <p className='text-white text-sm font-medium'>Moderator</p>
            <p className='text-white/60 text-xs'>Conversation Guide</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
