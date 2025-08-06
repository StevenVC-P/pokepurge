# Local AI Pokemon Role Generator Setup Guide

This guide will help you set up a local AI agent using Ollama to generate Pokemon role summaries and notes completely offline on your machine.

## Why Local AI?

- **🔒 Privacy**: All data stays on your machine
- **💰 Cost**: No API fees or usage limits
- **⚡ Speed**: No network latency once set up
- **🌐 Offline**: Works without internet connection
- **🎛️ Control**: Full control over model and parameters

## Prerequisites

- Windows 10/11, macOS, or Linux
- At least 8GB RAM (16GB recommended for larger models)
- 4GB+ free disk space for models

## Step 1: Install Ollama

### Windows

1. Download Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Run the installer
3. Ollama will start automatically as a service

### macOS

```bash
# Using Homebrew
brew install ollama

# Or download from https://ollama.ai/
```

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## Step 2: Download a Model

Choose one of these models based on your system capabilities:

### Recommended Models

**For 8GB RAM systems:**

```bash
ollama pull llama3.1:8b
```

**For 16GB+ RAM systems (better quality):**

```bash
ollama pull llama3.1:70b
```

**Lightweight option (4GB RAM):**

```bash
ollama pull mistral:7b
```

**Code-focused model:**

```bash
ollama pull codellama:7b
```

## Step 3: Verify Installation

Test that Ollama is working:

```bash
ollama run llama3.1:8b "Hello, can you help with Pokemon GO analysis?"
```

You should see a response from the AI model.

## Step 4: Configure the Script

The script uses these environment variables (optional):

```bash
# Set custom model (default: llama3.1:8b)
export OLLAMA_MODEL=mistral:7b

# Set custom Ollama host (default: http://localhost:11434)
export OLLAMA_HOST=http://localhost:11434
```

## Step 5: Run the Local AI Generator

### Demo Mode (No Ollama Required)

```bash
node fetchData/processors/addRoleSummaryAndNotesLocal.js --demo
```

### Full Processing (Requires Ollama)

```bash
node fetchData/processors/addRoleSummaryAndNotesLocal.js
```

## Model Comparison

| Model        | Size  | RAM Required | Quality                    | Speed |
| ------------ | ----- | ------------ | -------------------------- | ----- |
| llama3.1:8b  | 4.7GB | 8GB          | High                       | Fast  |
| llama3.1:70b | 40GB  | 64GB         | Excellent                  | Slow  |
| mistral:7b   | 4.1GB | 8GB          | Good                       | Fast  |
| codellama:7b | 3.8GB | 8GB          | Good for structured output | Fast  |

## Performance Tips

### Optimize for Speed

- Use smaller models (7b-8b parameters)
- Reduce batch size in the script
- Close other applications to free RAM

### Optimize for Quality

- Use larger models (70b+ parameters)
- Increase temperature for more creative responses
- Use multiple models and compare outputs

## Troubleshooting

### Ollama Not Found

```
❌ Ollama is not available
```

**Solutions:**

1. Ensure Ollama is installed and running
2. Check if the service is started: `ollama serve`
3. Verify the model is downloaded: `ollama list`

### Model Not Found

```
Error: model 'llama3.1:8b' not found
```

**Solution:**

```bash
ollama pull llama3.1:8b
```

### Out of Memory

```
Error: not enough memory
```

**Solutions:**

1. Use a smaller model: `ollama pull mistral:7b`
2. Close other applications
3. Reduce batch size in the script

### Slow Performance

**Solutions:**

1. Use GPU acceleration if available
2. Use smaller models
3. Reduce concurrent requests in batch processing

## Advanced Configuration

### Custom Model Parameters

Edit the script to adjust model parameters:

```javascript
options: {
  temperature: 0.7,    // Creativity (0.0-1.0)
  top_p: 0.9,         // Nucleus sampling
  max_tokens: 300     // Response length
}
```

### Custom Prompts

Modify the prompt templates in the script to customize AI behavior:

- `generateRoleSummaryPrompt()` - For role summaries
- `generateNotesPrompt()` - For detailed notes

## Expected Performance

### Processing Times (llama3.1:8b on 16GB RAM)

- **Per Pokemon**: ~2-5 seconds
- **Batch of 5**: ~10-25 seconds
- **Full dataset (1,620)**: ~1-2 hours

### Quality Expectations

- **Role Summaries**: Concise, accurate, practical advice
- **Detailed Notes**: Comprehensive analysis with specific data
- **Consistency**: Similar quality to GPT-4 for this specific task

## Cost Comparison

| Method                       | Setup Cost | Running Cost | Total (1,620 Pokemon) |
| ---------------------------- | ---------- | ------------ | --------------------- |
| Local AI (Ollama)            | $0         | $0           | $0                    |
| Local AI (one-time hardware) | $500-2000  | $0           | Hardware cost         |

## Integration with runAll.js Pipeline

The Local AI generator is now integrated into your main data pipeline!

### Automatic Processing

```bash
# Run the complete pipeline including AI generation
node fetchData/runAll.js

# Skip to just the building phase (includes AI)
node fetchData/runAll.js --skip-scrapers --skip-processors
```

### Manual Processing

```bash
# Run just the AI step manually
node fetchData/processors/addRoleSummaryAndNotesLocal.js

# Test with demo mode
node fetchData/processors/addRoleSummaryAndNotesLocal.js --demo
```

### Pipeline Integration Details

- **Position**: Final step in the building phase
- **Input**: `fetchData/outputs/PokemonMaster.json`
- **Output**: `public/data/pokemon.json` (with roleSummary and notes fields)
- **Timeout**: 2 hours (configurable in runAll.js)
- **Progress**: Real-time batch progress reporting

## Next Steps

1. ✅ Install Ollama and download Llama3 (completed)
2. ✅ Test the AI generator (completed)
3. 🚀 Run your complete pipeline: `node fetchData/runAll.js`
4. 📊 Use the generated role summaries in your Pokemon charts and UI

The local AI system is now fully integrated and will automatically generate high-quality role summaries and notes for all your Pokemon data!
