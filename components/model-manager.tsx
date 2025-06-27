'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOllamaClient, type OllamaStatus } from '@/lib/ollama-client';
import { AlertCircle, CheckCircle, HardDrive, RefreshCw, Server, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModelManagerProps {
  className?: string;
}

export function ModelManager({ className }: ModelManagerProps) {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [newModelName, setNewModelName] = useState('');
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);
  const ollamaClient = useOllamaClient();

  const checkStatus = async () => {
    setLoading(true);
    try {
      const statusResult = await ollamaClient.getStatus();
      setStatus(statusResult);
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
      setStatus({
        status: 'error',
        error: 'Failed to connect to Ollama',
        serverUrl: 'http://localhost:11434',
        models: [],
        totalModels: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handlePullModel = async () => {
    if (!newModelName.trim()) return;

    setPullingModel(newModelName);
    const result = await ollamaClient.pullModel(newModelName);

    if (result.success) {
      alert(result.message);
      setNewModelName('');
      // Refresh status to see new models
      setTimeout(checkStatus, 2000);
    } else {
      alert(`Failed to pull model: ${result.message}`);
    }
    setPullingModel(null);
  };

  const handleDeleteModel = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) return;

    setDeletingModel(modelName);
    const result = await ollamaClient.deleteModel(modelName);

    if (result.success) {
      alert(result.message);
      checkStatus(); // Refresh to remove deleted model
    } else {
      alert(`Failed to delete model: ${result.message}`);
    }
    setDeletingModel(null);
  };

  const formatModelSize = (size: number) => {
    const gb = size / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw size={16} className='animate-spin' />;

    switch (status?.status) {
      case 'online':
        return <CheckCircle size={16} className='text-green-500' />;
      case 'offline':
        return <AlertCircle size={16} className='text-red-500' />;
      case 'error':
        return <AlertCircle size={16} className='text-yellow-500' />;
      case 'cors-blocked':
        return <AlertCircle size={16} className='text-orange-500' />;
      default:
        return <Server size={16} className='text-gray-500' />;
    }
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';

    switch (status?.status) {
      case 'online':
        return 'Ollama Online';
      case 'offline':
        return 'Ollama Offline';
      case 'error':
        return 'Connection Error';
      case 'cors-blocked':
        return 'CORS Blocked';
      default:
        return 'Unknown Status';
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

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse'></div>
          <span className='text-sm text-gray-500'>Checking Ollama status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 bg-red-500 rounded-full'></div>
          <span className='text-sm text-red-600'>Failed to check Ollama status</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <HardDrive size={20} className='text-blue-400' />
          <span className='text-sm font-medium text-white'>Model Manager</span>
        </div>
        <Button
          onClick={checkStatus}
          variant='ghost'
          size='sm'
          className='text-white/60 hover:text-white hover:bg-white/10'
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Server Status */}
      <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
        <div className='flex items-center gap-2 mb-3'>
          {getStatusIcon()}
          <span className='text-sm font-medium text-white'>{getStatusText()}</span>
        </div>

        {status?.status === 'online' && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/60'>
            <div>
              <div className='font-medium text-white mb-1'>Models Installed</div>
              <div className='text-2xl font-bold text-blue-400'>{status.totalModels}</div>
            </div>
            <div>
              <div className='font-medium text-white mb-1'>Server URL</div>
              <div className='font-mono text-xs'>{status.serverUrl}</div>
            </div>
            <div>
              <div className='font-medium text-white mb-1'>Server Info</div>
              <div className='text-xs'>Version: {status.serverInfo?.version || 'Unknown'}</div>
            </div>
          </div>
        )}

        {status?.status === 'error' && (
          <div className='text-red-400 text-sm'>
            <div className='font-medium mb-1'>Connection Error</div>
            <div className='text-xs text-white/60'>{status.error || 'Unable to connect to Ollama server'}</div>
            <div className='text-xs text-white/40 mt-2'>
              Make sure Ollama is running locally: <code className='text-blue-300'>ollama serve</code>
            </div>
          </div>
        )}

        {status?.status === 'offline' && (
          <div className='text-yellow-400 text-sm'>
            <div className='font-medium mb-1'>Ollama Offline</div>
            <div className='text-xs text-white/60'>Ollama server is not responding at {status.serverUrl}</div>
            <div className='text-xs text-white/40 mt-2'>
              Start Ollama: <code className='text-blue-300'>ollama serve</code>
            </div>
          </div>
        )}

        {status?.status === 'cors-blocked' && (
          <div className='text-orange-400 text-sm'>
            <div className='font-medium mb-1'>CORS Blocked</div>
            <div className='text-xs text-white/60 mb-3'>
              {status.error || 'Browser is blocking requests to local Ollama server'}
            </div>
            {status.corsInstructions && (
              <div className='bg-white/10 rounded-lg p-3'>
                <div className='font-medium text-orange-300 mb-2'>Setup Instructions:</div>
                <pre className='text-xs text-white/80 whitespace-pre-wrap font-mono leading-relaxed'>
                  {status.corsInstructions}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Installed Models */}
      {status?.status === 'online' && status.models.length > 0 && (
        <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
          <div className='flex items-center gap-2 mb-4'>
            <HardDrive size={16} className='text-blue-400' />
            <span className='text-sm font-medium text-white'>Installed Models</span>
          </div>

          <div className='space-y-3'>
            {status.models.map((model) => {
              const isDeleting = deletingModel === model.name;

              return (
                <div
                  key={model.name}
                  className='flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-1'>
                      <span className='text-sm font-medium text-white'>{model.name}</span>
                      <Badge className='bg-blue-500/20 text-blue-300 border-blue-500/30'>
                        {formatModelSize(model.size)}
                      </Badge>
                    </div>
                    <div className='text-xs text-white/60'>Modified: {formatDate(model.modified_at)}</div>
                  </div>

                  <Button
                    onClick={() => handleDeleteModel(model.name)}
                    variant='ghost'
                    size='sm'
                    disabled={isDeleting}
                    className='text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  >
                    {isDeleting ? <RefreshCw size={14} className='animate-spin' /> : <Trash2 size={14} />}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pull New Model Section */}
      {status?.status === 'online' && (
        <div className='space-y-3'>
          <h3 className='text-lg font-semibold'>Download New Model</h3>
          <div className='flex gap-2'>
            <Input
              placeholder='Enter model name (e.g., llama3.2:3b)'
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
              disabled={pullingModel !== null}
            />
            <Button onClick={handlePullModel} disabled={!newModelName.trim() || pullingModel !== null}>
              {pullingModel ? 'Downloading...' : 'Download'}
            </Button>
          </div>
          <p className='text-xs text-gray-500'>Popular models: {popularModels.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
