'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOllamaClient } from '@/lib/ollama-client';
import { ChevronDown, Cloud, Cpu, HardDrive, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModelConfig {
  provider: string;
  model: string;
}

interface ModelSelectorProps {
  defenderModel: ModelConfig;
  criticModel: ModelConfig;
  onModelChange: (role: 'defender' | 'critic', provider: string, model: string) => void;
  disabled?: boolean;
}

// Available models by provider
const PROVIDER_MODELS = {
  ollama: [
    'phi3:3.8b',
    'qwen3:8b',
    'deepseek-r1:latest',
    'phi4:latest',
    'mistral:latest',
    'llama3.2:latest',
    'gemma2:latest',
    'codellama:latest',
  ],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ],
};

const PROVIDER_INFO = {
  ollama: {
    name: 'Ollama',
    icon: HardDrive,
    description: 'Local models (Free)',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  openai: {
    name: 'OpenAI',
    icon: Cloud,
    description: 'GPT models (API Key)',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  anthropic: {
    name: 'Anthropic',
    icon: Cpu,
    description: 'Claude models (API Key)',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
};

export function ModelSelector({ defenderModel, criticModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const ollamaClient = useOllamaClient();

  // Fetch available Ollama models on mount using client-side service
  useEffect(() => {
    const fetchOllamaModels = async () => {
      try {
        const models = await ollamaClient.getAvailableModels();
        if (models.length > 0) {
          setAvailableOllamaModels(models);
        } else {
          // Use default models if Ollama is not available or no models installed
          setAvailableOllamaModels(PROVIDER_MODELS.ollama);
        }
      } catch (error) {
        console.log('Ollama not available:', error);
        // Use default models if Ollama is not available
        setAvailableOllamaModels(PROVIDER_MODELS.ollama);
      }
    };

    fetchOllamaModels();
  }, [ollamaClient]);

  const getProviderIcon = (provider: string) => {
    const info = PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO];
    if (!info) return <Settings size={14} />;
    const Icon = info.icon;
    return <Icon size={14} />;
  };

  const getProviderColor = (provider: string) => {
    const info = PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO];
    return info?.color || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getAvailableModels = (provider: string): string[] => {
    if (provider === 'ollama') {
      return availableOllamaModels.length > 0 ? availableOllamaModels : PROVIDER_MODELS.ollama;
    }
    return PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS] || [];
  };

  const formatModelName = (model: string) => {
    // Clean up model names for display
    return model.replace(':latest', '').replace(':8b', ' 8B').replace(':3.8b', ' 3.8B');
  };

  const ModelDropdown = ({ role, config }: { role: 'defender' | 'critic'; config: ModelConfig }) => {
    const roleName = role === 'defender' ? 'River' : 'Sage';
    const roleColor = role === 'defender' ? 'text-blue-400' : 'text-red-400';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className='bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40 min-w-[200px] justify-between'
            disabled={disabled}
          >
            <div className='flex items-center gap-2'>
              {getProviderIcon(config.provider)}
              <div className='text-left'>
                <div className={`text-sm font-medium ${roleColor}`}>{roleName}</div>
                <div className='text-xs text-white/60'>{formatModelName(config.model)}</div>
              </div>
            </div>
            <ChevronDown size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-64 bg-gray-900 border-white/20'>
          <DropdownMenuLabel className={`${roleColor} font-medium`}>Select Model for {roleName}</DropdownMenuLabel>
          <DropdownMenuSeparator className='bg-white/20' />

          {Object.entries(PROVIDER_INFO).map(([providerId, providerInfo]) => {
            const models = getAvailableModels(providerId);
            if (models.length === 0) return null;

            return (
              <div key={providerId}>
                <DropdownMenuLabel className='text-white/70 text-xs uppercase tracking-wide'>
                  <div className='flex items-center gap-2'>
                    <providerInfo.icon size={12} />
                    {providerInfo.name}
                  </div>
                </DropdownMenuLabel>
                {models.map((model) => (
                  <DropdownMenuItem
                    key={`${providerId}-${model}`}
                    onClick={() => onModelChange(role, providerId, model)}
                    className='text-white hover:bg-white/10 cursor-pointer'
                  >
                    <div className='flex items-center justify-between w-full'>
                      <span className='text-sm'>{formatModelName(model)}</span>
                      {config.provider === providerId && config.model === model && (
                        <Badge className={getProviderColor(providerId)}>Current</Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className='bg-white/10' />
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className='flex items-center gap-3'>
      <ModelDropdown role='defender' config={defenderModel} />
      <div className='text-white/40 text-sm'>vs</div>
      <ModelDropdown role='critic' config={criticModel} />
    </div>
  );
}
