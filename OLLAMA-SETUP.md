# Ollama Setup Guide for AI Arena

AI Arena uses Ollama to run local AI models for free, private conversations. This guide will help you get started.

## Quick Start

### 1. Install Ollama

Visit [ollama.ai](https://ollama.ai) and download the installer for your operating system:

- **macOS**: Download the `.dmg` file and drag to Applications
- **Windows**: Download the `.exe` installer
- **Linux**: Run the installation script

### 2. Start Ollama Server

After installation, start the Ollama server:

```bash
ollama serve
```

The server will run on `http://localhost:11434` by default.

### 3. Download Your First Model

Open AI Arena and check the **Model Manager** in the sidebar. You'll see:

- **Server Status**: Shows if Ollama is running
- **Installed Models**: Currently downloaded models
- **Popular Models**: Recommended models to download

Click the download button next to any model to start downloading. Popular starter models:

- `phi3:3.8b` - Fast, lightweight (2.2GB)
- `qwen3:8b` - Alibaba's efficient model
- `mistral:latest` - High quality, larger size (4.1GB)

### 4. Start Your First Conversation

Once you have models installed:

1. Click **New Conversation** in the sidebar
2. Choose conversation type:
   - **Mixed**: Different models debate each other
   - **Same Model**: One model with different perspectives
   - **Collaborate**: Models work together
3. Select your models using the Model Selector in the header
4. Pick a conversation starter or write your own topic
5. Watch the AI models debate!

## Model Recommendations

### For Fast Conversations (2-4GB)

- `phi3:3.8b` - Microsoft's lightweight model
- `qwen3:8b` - Alibaba's efficient model
- `gemma2:latest` - Google's open model

### For High Quality (4-8GB)

- `mistral:latest` - Excellent reasoning
- `llama3.2:latest` - Meta's latest model
- `deepseek-r1:latest` - Strong coding abilities

### For Specialized Tasks

- `codellama:latest` - Programming and code generation
- `phi4:latest` - Microsoft's latest model (9GB)

## Troubleshooting

### Ollama Server Not Found

If the Model Manager shows "Ollama Offline":

1. Make sure Ollama is installed
2. Start the server: `ollama serve`
3. Check if port 11434 is available
4. Refresh the page

### Model Download Fails

If model downloads fail:

1. Check your internet connection
2. Ensure you have enough disk space (models are 2-10GB)
3. Try downloading a smaller model first
4. Check Ollama logs for errors

### Slow Model Performance

If models are slow:

1. Close other applications to free up RAM
2. Try smaller models (2-4GB range)
3. Ensure you have at least 8GB RAM available
4. Consider using GPU acceleration if available

### CORS Blocked Errors

If you see "CORS blocked" errors when using deployed apps:

1. Stop Ollama: `pkill ollama`
2. Set CORS environment variable: `export OLLAMA_ORIGINS="*"`
3. Restart Ollama: `ollama serve`
4. Refresh your browser

This is required when accessing Ollama from HTTPS websites (deployed apps) to your local HTTP server.

## Advanced Configuration

### Using Ollama with Deployed Apps (CORS Setup)

If you're using AI Arena from a deployed URL (like Vercel), you'll need to enable CORS to allow the browser to connect to your local Ollama server:

```bash
# Stop Ollama if running
pkill ollama

# Set CORS environment variable to allow all origins
export OLLAMA_ORIGINS="*"

# Start Ollama with CORS enabled
ollama serve
```

For permanent CORS setup, add this to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export OLLAMA_ORIGINS="*"
```

**Security Note**: This allows all websites to access your Ollama server. For production use, specify only trusted domains:

```bash
export OLLAMA_ORIGINS="https://your-app-domain.vercel.app,http://localhost:3000"
```

### Custom Model Paths

You can configure Ollama to use custom model directories:

```bash
export OLLAMA_MODELS=/path/to/your/models
ollama serve
```

### GPU Acceleration

For better performance, ensure your GPU drivers are up to date. Ollama will automatically use GPU acceleration when available.

### Memory Management

Models load into RAM when used. To free memory:

1. Close conversations you're not using
2. Restart Ollama server: `ollama serve`
3. Use smaller models for multiple conversations

## API Integration

AI Arena automatically integrates with Ollama's API. The following endpoints are used:

- `GET /api/ollama/status` - Check server status
- `POST /api/ollama/pull` - Download models
- `DELETE /api/ollama/delete` - Remove models

## Support

If you encounter issues:

1. Check the [Ollama documentation](https://ollama.ai/docs)
2. Visit the [Ollama GitHub repository](https://github.com/ollama/ollama)
3. Check AI Arena's console for error messages
4. Ensure your system meets the minimum requirements

## System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space for models
- **OS**: macOS 10.15+, Windows 10+, or Linux
- **Network**: Internet connection for model downloads

Happy debating! 🚀
