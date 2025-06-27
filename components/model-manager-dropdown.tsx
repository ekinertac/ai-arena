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
import { Input } from '@/components/ui/input';
import { useOllamaClient, type OllamaStatus } from '@/lib/ollama-client';
import { AlertCircle, CheckCircle, Download, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModelManagerDropdownProps {
  children: React.ReactNode;
}

export function ModelManagerDropdown({ children }: ModelManagerDropdownProps) {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [customPulling, setCustomPulling] = useState(false);
  const ollamaClient = useOllamaClient();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await ollamaClient.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Ollama status:', error);
      setStatus({
        status: 'error',
        serverUrl: 'http://localhost:11434',
        models: [],
        totalModels: 0,
        error: 'Failed to connect to Ollama server',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStatus();
    } else {
      setCustomModel('');
    }
  }, [open]);

  const pullModel = async (modelName: string) => {
    try {
      setPulling(modelName);
      const result = await ollamaClient.pullModel(modelName);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Refresh status after a short delay
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      console.error('Failed to pull model:', error);
    } finally {
      setPulling(null);
    }
  };

  const pullCustomModel = async () => {
    if (!customModel.trim()) return;

    try {
      setCustomPulling(true);
      const result = await ollamaClient.pullModel(customModel.trim());

      if (!result.success) {
        throw new Error(result.message);
      }

      setCustomModel('');
      // Refresh status after a short delay
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      console.error('Failed to pull custom model:', error);
    } finally {
      setCustomPulling(false);
    }
  };

  const deleteModel = async (modelName: string) => {
    try {
      setDeleting(modelName);
      const result = await ollamaClient.deleteModel(modelName);

      if (!result.success) {
        throw new Error(result.message);
      }

      fetchStatus();
    } catch (error) {
      console.error('Failed to delete model:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw size={12} className='animate-spin' />;

    switch (status?.status) {
      case 'online':
        return <CheckCircle size={12} className='text-green-500' />;
      case 'offline':
        return <AlertCircle size={12} className='text-red-500' />;
      case 'error':
        return <AlertCircle size={12} className='text-yellow-500' />;
      default:
        return <HardDrive size={12} className='text-gray-500' />;
    }
  };

  const popularModels = [
    'phi3:3.8b',
    'qwen3:8b',
    'deepseek-r1:latest',
    'phi4:latest',
    'mistral:latest',
    'llama3.2:latest',
    'gemma2:latest',
    'codellama:latest',
  ];

  const installedModels = status?.models.map((m) => m.name) || [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className='w-80 bg-gray-900 border-white/20' align='end'>
        {/* Header */}
        <DropdownMenuLabel className='flex items-center gap-2'>
          <HardDrive size={16} className='text-blue-400' />
          Ollama Models
          <div className='ml-auto flex items-center gap-1'>
            {getStatusIcon()}
            <span className='text-xs text-white/60'>
              {status?.status === 'online' ? 'Online' : status?.status === 'offline' ? 'Offline' : 'Error'}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='bg-white/20' />

        {/* Status Info */}
        {status?.status === 'online' && (
          <div className='px-2 py-1'>
            <div className='text-xs text-white/60'>
              {status.totalModels} models installed • {status.serverUrl}
            </div>
          </div>
        )}

        {status?.status === 'error' && (
          <div className='px-2 py-1'>
            <div className='text-xs text-red-400'>Connection failed</div>
            <div className='text-xs text-white/40'>Make sure Ollama is running</div>
          </div>
        )}

        {/* Custom Model Input */}
        <div className='px-2 py-2 space-y-2'>
          <div className='flex gap-2'>
            <Input
              placeholder='Enter model name (e.g., llama3.2:latest)'
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              className='bg-white/5 border-white/20 text-white text-xs h-7'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  pullCustomModel();
                }
              }}
            />
            <Button
              onClick={pullCustomModel}
              variant='ghost'
              size='sm'
              disabled={!customModel.trim() || customPulling || status?.status !== 'online'}
              className='text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 h-7 px-2'
            >
              {customPulling ? <RefreshCw size={12} className='animate-spin' /> : <Download size={12} />}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className='bg-white/20' />

        {/* Popular Models */}
        <DropdownMenuLabel className='text-xs text-white/70'>Popular Models</DropdownMenuLabel>
        <div className='max-h-40 overflow-y-auto'>
          {popularModels.map((model) => {
            const isInstalled = installedModels.includes(model);
            const isPulling = pulling === model;

            return (
              <DropdownMenuItem
                key={model}
                className='text-white hover:bg-white/10 cursor-pointer justify-between px-2 py-1'
                onClick={(e) => {
                  e.preventDefault();
                  if (!isInstalled && !isPulling && status?.status === 'online') {
                    pullModel(model);
                  }
                }}
              >
                <span className='text-xs'>{model.replace(':latest', '')}</span>
                <div className='flex items-center gap-1'>
                  {isInstalled && (
                    <Badge className='bg-green-500/20 text-green-300 border-green-500/30 text-xs'>Installed</Badge>
                  )}
                  {isPulling ? (
                    <RefreshCw size={10} className='animate-spin text-blue-400' />
                  ) : !isInstalled ? (
                    <Download size={10} className='text-white/60' />
                  ) : (
                    <CheckCircle size={10} className='text-green-500' />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        {/* Installed Models */}
        {status?.status === 'online' && status.models.length > 0 && (
          <>
            <DropdownMenuSeparator className='bg-white/20' />
            <DropdownMenuLabel className='text-xs text-white/70'>Installed Models</DropdownMenuLabel>
            <div className='max-h-32 overflow-y-auto'>
              {status.models.map((model) => {
                const isDeleting = deleting === model.name;

                return (
                  <div key={model.name} className='flex items-center justify-between px-2 py-1 hover:bg-white/5'>
                    <div className='flex-1 min-w-0'>
                      <div className='text-xs text-white truncate'>{model.name}</div>
                      <div className='text-xs text-white/40'>{formatBytes(model.size)}</div>
                    </div>
                    <Button
                      onClick={() => deleteModel(model.name)}
                      variant='ghost'
                      size='sm'
                      disabled={isDeleting}
                      className='text-red-400 hover:text-red-300 hover:bg-red-500/20 h-6 w-6 p-0'
                    >
                      {isDeleting ? <RefreshCw size={10} className='animate-spin' /> : <Trash2 size={10} />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty State */}
        {status?.status === 'online' && status.models.length === 0 && (
          <div className='px-2 py-4 text-center'>
            <div className='text-xs text-white/60'>No models installed</div>
            <div className='text-xs text-white/40'>Install popular models above</div>
          </div>
        )}

        {/* Offline Help */}
        {status?.status === 'offline' && (
          <div className='px-2 py-2'>
            <div className='text-xs text-yellow-400 mb-1'>Ollama not running</div>
            <div className='text-xs text-white/40'>
              Start with: <code className='text-blue-300'>ollama serve</code>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
