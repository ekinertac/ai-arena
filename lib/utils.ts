import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Create a SEO-friendly slug from a conversation title and ID
 * Example: "Universal Basic Income Debate" + "cmccmle7j000ajjmg8qxud122"
 * becomes: "universal-basic-income-debate-cmccmle7j"
 */
export function createConversationSlug(title: string, id: string): string {
  // Create slug from title
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50); // Limit length

  // Get short ID (first 9 characters)
  const shortId = id.substring(0, 9);

  return `${titleSlug}-${shortId}`;
}

/**
 * Extract conversation ID from a SEO-friendly slug
 * Example: "universal-basic-income-debate-cmccmle7j" returns "cmccmle7j"
 */
export function extractIdFromSlug(slug: string): string {
  // The ID is always the last part after the final hyphen
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];

  // Return the short ID (we'll need to find the full ID in the database)
  return shortId;
}

/**
 * Find full conversation ID from short ID
 * This will be used to match the short ID from URL to full database ID
 */
export function findConversationByShortId(conversations: { id: string }[], shortId: string): { id: string } | null {
  return conversations.find((conv) => conv.id.startsWith(shortId)) || null;
}
