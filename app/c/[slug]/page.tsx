'use client';

import AIBattle from '@/app/page';
import { DatabaseAPI } from '@/lib/database';
import { extractIdFromSlug, findConversationByShortId } from '@/lib/utils';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const loadConversation = async () => {
      try {
        // Check if we already have the conversation ID in query params
        const existingId = searchParams.get('c');
        if (existingId) {
          setConversationId(existingId);
          setLoading(false);
          return;
        }

        const slug = params.slug as string;
        const shortId = extractIdFromSlug(slug);

        // Load all conversations to find the matching one
        const conversations = await DatabaseAPI.getConversations();
        const foundConversation = findConversationByShortId(conversations, shortId);

        if (foundConversation) {
          // Update the URL to include the query parameter for the main component
          const url = new URL(window.location.href);
          url.searchParams.set('c', foundConversation.id);
          window.history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());

          setConversationId(foundConversation.id);
          setLoading(false);
        } else {
          // Conversation not found, redirect to home
          router.replace('/');
          return;
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Failed to load conversation');
        // Redirect to home on error
        setTimeout(() => router.replace('/'), 2000);
      }
    };

    loadConversation();
  }, [params.slug, router, searchParams]);

  if (loading) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-white'>Loading conversation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-red-400'>
          {error}
          <br />
          <span className='text-white/60'>Redirecting to home...</span>
        </div>
      </div>
    );
  }

  // Render the main AIBattle component
  return <AIBattle />;
}
