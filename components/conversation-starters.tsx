'use client';

import { conversationStarters, type ConversationStarter } from '@/lib/starters';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';

interface ConversationStartersProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  onStarterClick: (starter: ConversationStarter) => void;
}

export function ConversationStarters({
  selectedCategory,
  onCategorySelect,
  onStarterClick,
}: ConversationStartersProps) {
  return (
    <div className='flex-1 overflow-y-auto p-4 flex items-center justify-center'>
      <div className='max-w-4xl mx-auto w-full'>
        <motion.div
          className='flex flex-col items-center text-center mb-8'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className='w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center mb-6'>
            <Swords size={24} className='text-white' />
          </div>
          <h2 className='text-2xl font-bold text-white mb-2'>Start a New Conversation</h2>
          <p className='text-white/60 mb-8 max-w-md'>Present your topic and watch two AI models discuss it.</p>
          <p className='text-white/60 mb-8 max-w-md'>
            Choose different roles like Supporter vs Critic, Collaborators, or even the same model with different
            perspectives.
          </p>
        </motion.div>

        {/* Conversation Starters */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-white text-center'>Pick a conversation starter</h3>

          {/* Category Tabs */}
          <div className='flex flex-wrap justify-center gap-2 mb-6'>
            {conversationStarters.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>

          {/* Starters Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {conversationStarters
              .find((cat) => cat.id === selectedCategory)
              ?.starters.map((starter, index) => (
                <motion.button
                  key={starter.id}
                  onClick={() => onStarterClick(starter)}
                  className='p-4 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-200 group'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <p className='text-white/90 text-sm leading-relaxed group-hover:text-white transition-colors'>
                    {starter.text}
                  </p>
                </motion.button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
