# LocalAI VSCode Extension - Development Guide

## Quick Start

### Run the Extension

1. Open this folder in VSCode
2. Press `F5` to start debugging
3. A new VSCode window will open with the extension loaded
4. Configure your LocalAI endpoint: `Ctrl+Shift+P` → "LocalAI: Configure Endpoint"
5. Test the chat: Open chat panel and type `@localai hello`

### Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Run linter
npm run lint

# Package extension
npm run vscode:prepublish
```

## Architecture Overview

### Core Components

1. **[extension.ts](src/extension.ts)** - Extension lifecycle
   - Activation/deactivation
   - Command registration
   - Connection testing
   - Welcome message

2. **[localaiClient.ts](src/localaiClient.ts)** - LocalAI API client
   - HTTP communication with LocalAI
   - OpenAI-compatible API calls
   - Streaming support for chat
   - Configuration management

3. **[chatParticipant.ts](src/chatParticipant.ts)** - Chat integration
   - VSCode chat participant implementation
   - Message history management
   - Command handling (/explain, /fix, etc.)
   - Context extraction from editor

4. **[completionProvider.ts](src/completionProvider.ts)** - Code completion
   - Inline completion provider
   - Context building from document
   - Debouncing and performance optimization
   - Completion cleaning and formatting

### Data Flow

#### Chat Request Flow
```
User Input (@localai message)
    ↓
ChatParticipant.handleChatRequest()
    ↓
Build message history + context
    ↓
LocalAIClient.chatStream()
    ↓
POST /v1/chat/completions (streaming)
    ↓
Stream response chunks to chat panel
```

#### Completion Request Flow
```
User types in editor
    ↓
Debounce delay (default: 500ms)
    ↓
CompletionProvider.provideInlineCompletionItems()
    ↓
Build context (50 lines before, 10 after)
    ↓
LocalAIClient.complete()
    ↓
POST /v1/completions
    ↓
Clean and return completion
```

## Configuration

### Extension Settings

All settings are prefixed with `localai.`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `endpoint` | string | `http://localhost:8080` | LocalAI server URL |
| `apiKey` | string | `""` | API authentication key |
| `chatModel` | string | `""` | Model for chat |
| `completionModel` | string | `""` | Model for completions |
| `maxTokens` | number | `2048` | Max response tokens |
| `temperature` | number | `0.7` | Generation temperature |
| `enableCompletion` | boolean | `true` | Enable code completion |
| `completionDelay` | number | `500` | Completion trigger delay (ms) |

### LocalAI Endpoints Used

- `GET /v1/models` - List available models (connection test)
- `POST /v1/chat/completions` - Chat completions (streaming and non-streaming)
- `POST /v1/completions` - Text completions (for code)

## Features Implementation

### Chat Commands

Commands are implemented in [chatParticipant.ts:125-162](src/chatParticipant.ts#L125-L162)

- `/explain` - Code explanation
- `/fix` - Bug fixing
- `/optimize` - Performance optimization
- `/document` - Documentation generation
- `/test` - Unit test generation

Each command modifies the prompt to guide the AI appropriately.

### Code Context

The extension extracts context from:
- Selected code (if any)
- 50 lines before cursor
- 10 lines after cursor
- File language ID
- File name

### Streaming

Chat responses use Server-Sent Events (SSE) streaming:
- Chunks arrive as `data: {...}` lines
- Parsed incrementally
- Displayed in real-time to user

### Error Handling

- Connection failures show user-friendly messages
- Silent failures for completions (non-intrusive)
- Configuration validation on startup
- Timeout handling (60s default)

## Testing

### Manual Testing Checklist

- [ ] Chat responds to `@localai` messages
- [ ] All commands work (/explain, /fix, etc.)
- [ ] Code completions appear while typing
- [ ] Settings changes take effect immediately
- [ ] Connection test command works
- [ ] Toggle completion command works
- [ ] Works with and without API key
- [ ] Handles LocalAI server disconnection gracefully

### Test with Different Models

1. Chat models: CodeLlama, Mistral, Phi-3
2. Completion models: StarCoder, smaller CodeLlama variants
3. Test with different context sizes
4. Test with different temperatures

## Packaging

### Create VSIX

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package
vsce package
```

This creates `localai-vscode-0.1.0.vsix` ready for installation.

### Install Locally

```bash
code --install-extension localai-vscode-0.1.0.vsix
```

## Performance Optimization

### Current Optimizations

1. **Debouncing** - Completions delayed by configurable time
2. **Context limiting** - Only 50 lines before + 10 after
3. **Silent failures** - Completions fail gracefully
4. **Configuration caching** - Client updates only on config change
5. **Streaming** - Chat uses SSE for responsive UI

### Future Optimizations

- [ ] Completion caching
- [ ] Model-specific prompt optimization
- [ ] Adaptive context size based on model
- [ ] Request cancellation on rapid typing
- [ ] Queue management for multiple requests

## Known Limitations

1. **No multi-turn context** for completions (stateless)
2. **No code-aware parsing** (treats code as text)
3. **Single completion** per trigger (no alternatives)
4. **No fine-tuning** for specific languages
5. **Synchronous completion** (waits for full response)

## Debugging

### Enable Debug Logs

1. Open Output panel (`Ctrl+Shift+U`)
2. Select "LocalAI" from dropdown
3. Console logs appear here

### Common Issues

**"Cannot connect to LocalAI"**
- Check LocalAI is running: `curl http://localhost:8080/v1/models`
- Verify endpoint in settings
- Check for firewall issues

**"No completions appearing"**
- Verify `localai.enableCompletion` is true
- Check completion delay setting
- Ensure model is loaded in LocalAI
- Look for errors in Output panel

**"Slow responses"**
- Use smaller models for completions
- Reduce `maxTokens` setting
- Check LocalAI resource usage
- Consider GPU acceleration

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

GPL-3.0 - See [LICENSE](LICENSE)
