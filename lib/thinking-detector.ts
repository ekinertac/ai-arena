/**
 * Dynamic Thinking Detector
 * Analyzes model outputs to detect thinking/reasoning patterns
 */

export interface ThinkingAnalysis {
  hasThinking: boolean;
  confidence: number;
  patterns: string[];
  reasoningSteps: number;
}

export function detectThinking(response: string): ThinkingAnalysis {
  const patterns: string[] = [];
  let reasoningSteps = 0;
  let confidence = 0;

  // Convert to lowercase for pattern matching
  const lowerResponse = response.toLowerCase();

  // Step-by-step reasoning patterns
  const stepPatterns = [
    /step\s*\d+:/i,
    /\d+\.\s/, // Numbered lists
    /first,?\s/i,
    /second,?\s/i,
    /third,?\s/i,
    /next,?\s/i,
    /then,?\s/i,
    /finally,?\s/i,
    /let's\s+solve/i,
    /let\s+me\s+break\s+this\s+down/i,
    /let\s+me\s+think\s+through\s+this/i,
  ];

  // Mathematical reasoning patterns
  const mathPatterns = [
    /so,?\s*\d+\s*[+\-*/]\s*\d+\s*=\s*\d+/i,
    /therefore,?\s*\d+\s*[+\-*/]\s*\d+\s*=\s*\d+/i,
    /which\s+equals\s*\d+/i,
    /which\s+is\s*\d+/i,
    /gives\s+us\s*\d+/i,
    /results\s+in\s*\d+/i,
  ];

  // Logical reasoning patterns
  const logicPatterns = [
    /because/i,
    /since/i,
    /as\s+a\s+result/i,
    /this\s+means/i,
    /therefore/i,
    /thus/i,
    /consequently/i,
    /which\s+means/i,
    /so\s+we\s+have/i,
    /now\s+we\s+have/i,
  ];

  // Process explanation patterns
  const processPatterns = [
    /to\s+find\s+out/i,
    /to\s+calculate/i,
    /to\s+determine/i,
    /we\s+need\s+to/i,
    /we\s+must/i,
    /we\s+should/i,
    /let's\s+calculate/i,
    /let's\s+figure\s+out/i,
  ];

  // Check for step patterns
  stepPatterns.forEach((pattern) => {
    if (pattern.test(response)) {
      patterns.push('step-by-step');
      confidence += 0.3;
      reasoningSteps += (response.match(pattern) || []).length;
    }
  });

  // Check for mathematical reasoning
  mathPatterns.forEach((pattern) => {
    if (pattern.test(response)) {
      patterns.push('mathematical-reasoning');
      confidence += 0.25;
    }
  });

  // Check for logical reasoning
  logicPatterns.forEach((pattern) => {
    if (pattern.test(response)) {
      patterns.push('logical-reasoning');
      confidence += 0.2;
    }
  });

  // Check for process explanation
  processPatterns.forEach((pattern) => {
    if (pattern.test(response)) {
      patterns.push('process-explanation');
      confidence += 0.15;
    }
  });

  // Additional confidence based on response structure
  const lines = response.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length >= 3) {
    confidence += 0.1; // Multi-line responses often indicate thinking
  }

  // Structured thinking patterns (tags and markers) - based on real model outputs
  const structuredPatterns = [
    // DeepSeek-R1 and similar models
    /<think>[\s\S]*?<\/think>/i,
    /<thinking>[\s\S]*?<\/thinking>/i,
    /<reason>[\s\S]*?<\/reason>/i,
    /<reasoning>[\s\S]*?<\/reasoning>/i,

    // Claude and Anthropic patterns
    /\[thinking\][\s\S]*?\[\/thinking\]/i,
    /\[think\][\s\S]*?\[\/think\]/i,

    // Markdown-style thinking blocks
    /```thinking[\s\S]*?```/i,
    /```reasoning[\s\S]*?```/i,

    // Bold markdown patterns
    /\*\*thinking\*\*[\s\S]*?\*\*\/thinking\*\*/i,
    /\*\*reasoning\*\*[\s\S]*?\*\*\/reasoning\*\*/i,

    // OpenAI o1-style patterns (less common but possible)
    /\[analysis\][\s\S]*?\[\/analysis\]/i,
    /\[work\][\s\S]*?\[\/work\]/i,

    // Chain of thought indicators
    /chain.of.thought:/i,
    /reasoning.process:/i,
    /thought.process:/i,
  ];

  // Check for structured thinking patterns
  structuredPatterns.forEach((pattern) => {
    if (pattern.test(response)) {
      patterns.push('structured-thinking');
      confidence += 0.4; // Higher confidence for explicit structured thinking
    }
  });

  // Check for explicit thinking indicators
  if (lowerResponse.includes('thinking') || lowerResponse.includes('reasoning')) {
    patterns.push('explicit-thinking');
    confidence += 0.2;
  }

  // Normalize confidence to 0-1 range
  confidence = Math.min(confidence, 1.0);

  // Determine if this is thinking based on confidence threshold
  const hasThinking = confidence >= 0.4;

  return {
    hasThinking,
    confidence,
    patterns: [...new Set(patterns)], // Remove duplicates
    reasoningSteps,
  };
}

export function getThinkingDescription(analysis: ThinkingAnalysis): string {
  if (!analysis.hasThinking) {
    return 'Direct Response';
  }

  if (analysis.confidence >= 0.8) {
    return 'Strong Reasoning';
  } else if (analysis.confidence >= 0.6) {
    return 'Good Reasoning';
  } else {
    return 'Basic Reasoning';
  }
}

export function getThinkingColor(analysis: ThinkingAnalysis): string {
  if (!analysis.hasThinking) {
    return 'text-gray-400';
  }

  if (analysis.confidence >= 0.8) {
    return 'text-green-400';
  } else if (analysis.confidence >= 0.6) {
    return 'text-blue-400';
  } else {
    return 'text-yellow-400';
  }
}
