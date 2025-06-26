export interface ConversationStarter {
  id: string;
  text: string;
  category: string;
}

export interface StarterCategory {
  id: string;
  icon: string;
  label: string;
  description: string;
  starters: ConversationStarter[];
}

export const conversationStarters: StarterCategory[] = [
  {
    id: 'technology',
    icon: '🚀',
    label: 'Technology',
    description: 'Explore the future of tech and innovation',
    starters: [
      {
        id: 'ai-future',
        text: 'Should AI development be regulated by governments?',
        category: 'technology',
      },
      {
        id: 'remote-work',
        text: 'Is remote work better for productivity than office work?',
        category: 'technology',
      },
      {
        id: 'social-media',
        text: 'Are social media platforms doing more harm than good?',
        category: 'technology',
      },
      {
        id: 'crypto',
        text: 'Will cryptocurrencies replace traditional banking?',
        category: 'technology',
      },
      {
        id: 'automation',
        text: 'How should society handle job displacement from automation?',
        category: 'technology',
      },
    ],
  },
  {
    id: 'philosophy',
    icon: '🤔',
    label: 'Philosophy',
    description: 'Deep questions about life and existence',
    starters: [
      {
        id: 'free-will',
        text: 'Do humans have free will or is everything predetermined?',
        category: 'philosophy',
      },
      {
        id: 'meaning-life',
        text: 'What gives life meaning and purpose?',
        category: 'philosophy',
      },
      {
        id: 'consciousness',
        text: 'Can machines ever truly be conscious?',
        category: 'philosophy',
      },
      {
        id: 'ethics-ai',
        text: 'Should AI systems be programmed with human moral values?',
        category: 'philosophy',
      },
      {
        id: 'reality',
        text: 'How can we know what is real versus simulated?',
        category: 'philosophy',
      },
    ],
  },
  {
    id: 'society',
    icon: '🌍',
    label: 'Society',
    description: 'Current issues and social challenges',
    starters: [
      {
        id: 'climate-change',
        text: 'What is the most effective way to address climate change?',
        category: 'society',
      },
      {
        id: 'education',
        text: 'Should education be completely personalized using AI?',
        category: 'society',
      },
      {
        id: 'inequality',
        text: 'How can we reduce wealth inequality in modern society?',
        category: 'society',
      },
      {
        id: 'democracy',
        text: 'Is democracy the best form of government for the digital age?',
        category: 'society',
      },
      {
        id: 'privacy',
        text: 'Should privacy be considered a fundamental human right?',
        category: 'society',
      },
    ],
  },
  {
    id: 'creative',
    icon: '🎨',
    label: 'Creative',
    description: 'Art, culture, and creative expression',
    starters: [
      {
        id: 'ai-art',
        text: 'Can AI-generated art be considered true creativity?',
        category: 'creative',
      },
      {
        id: 'music-evolution',
        text: 'How will music evolve with AI and virtual reality?',
        category: 'creative',
      },
      {
        id: 'storytelling',
        text: 'What makes a story compelling in the digital age?',
        category: 'creative',
      },
      {
        id: 'cultural-preservation',
        text: 'How should we preserve culture in a globalized world?',
        category: 'creative',
      },
      {
        id: 'virtual-experiences',
        text: 'Can virtual experiences replace real-world cultural events?',
        category: 'creative',
      },
    ],
  },
  {
    id: 'science',
    icon: '🔬',
    label: 'Science',
    description: 'Scientific discoveries and theories',
    starters: [
      {
        id: 'space-exploration',
        text: 'Should humanity prioritize Mars colonization or Earth sustainability?',
        category: 'science',
      },
      {
        id: 'genetic-engineering',
        text: 'Is genetic engineering of humans ethical?',
        category: 'science',
      },
      {
        id: 'quantum-computing',
        text: 'How will quantum computing change our world?',
        category: 'science',
      },
      {
        id: 'life-extension',
        text: 'Should we try to extend human lifespan indefinitely?',
        category: 'science',
      },
      {
        id: 'alien-life',
        text: 'What would discovering alien life mean for humanity?',
        category: 'science',
      },
    ],
  },
  {
    id: 'business',
    icon: '💼',
    label: 'Business',
    description: 'Economics, entrepreneurship, and markets',
    starters: [
      {
        id: 'universal-income',
        text: 'Should governments implement universal basic income?',
        category: 'business',
      },
      {
        id: 'big-tech',
        text: 'Are tech giants too powerful and should they be broken up?',
        category: 'business',
      },
      {
        id: 'work-future',
        text: 'What will work look like in a post-AI economy?',
        category: 'business',
      },
      {
        id: 'sustainability',
        text: 'Can businesses be profitable while prioritizing sustainability?',
        category: 'business',
      },
      {
        id: 'globalization',
        text: 'Is economic globalization beneficial for everyone?',
        category: 'business',
      },
    ],
  },
];

export function getStartersByCategory(categoryId: string): ConversationStarter[] {
  const category = conversationStarters.find((cat) => cat.id === categoryId);
  return category?.starters || [];
}

export function getAllStarters(): ConversationStarter[] {
  return conversationStarters.flatMap((category) => category.starters);
}

export function getRandomStarters(count: number = 5): ConversationStarter[] {
  const allStarters = getAllStarters();
  const shuffled = allStarters.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
