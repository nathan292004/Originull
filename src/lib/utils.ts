import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ModelConfig } from '@/types/misc';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PARAMETRIC_MODELS: ModelConfig[] = [
  {
    id: 'anthropic/claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: 'Most intelligent Anthropic model for accurate CAD generation',
    provider: 'Anthropic',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'openai/o4-mini',
    name: 'o4-mini',
    description: 'Fast OpenAI reasoning model for accurate CAD generation',
    provider: 'OpenAI',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description:
      'Fast Google model with built-in thinking for great CAD output',
    provider: 'Google',
    supportsTools: true,
    supportsThinking: true,
    supportsVision: true,
  },
];
