# LocalAI VSCode Extension

Chat with LocalAI and get AI-powered code completions directly in Visual Studio Code using your local AI models.

## Features

- **Chat Integration**: Use `@localai` in VSCode's chat panel to interact with your local AI models
- **Code Completion**: Get inline code suggestions powered by LocalAI
- **Specialized Commands**: Quick actions for common coding tasks
  - `/explain` - Explain selected code
  - `/fix` - Fix bugs in selected code
  - `/optimize` - Optimize code for performance
  - `/document` - Generate documentation
  - `/test` - Generate unit tests
- **Privacy-First**: All processing happens locally on your machine
- **OpenAI-Compatible**: Works with any LocalAI installation

## Prerequisites

- Visual Studio Code v1.85.0 or higher
- [LocalAI](https://github.com/mudler/LocalAI) running locally or accessible via network
- At least one model loaded in LocalAI

## Installation

### From VSIX (Recommended for now)

1. Download the latest `.vsix` file from releases
2. Open VSCode
3. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click the "..." menu at the top
5. Select "Install from VSIX..."
6. Choose the downloaded file

### From Source

```bash
git clone https://github.com/weatherills/LocalAI-vscode.git
cd LocalAI-vscode
npm install
npm run compile
```

Press F5 in VSCode to open a new window with the extension loaded.

## Setup

### 1. Start LocalAI

Make sure LocalAI is running. Default endpoint is `http://localhost:8080`.

```bash
# Example: Start LocalAI with docker
docker run -p 8080:8080 --name local-ai -ti localai/localai:latest
```

### 2. Configure the Extension

Open VSCode settings (`Ctrl+,` / `Cmd+,`) and search for "LocalAI" or use the command:

```
LocalAI: Configure Endpoint
```

**Available Settings:**

- `localai.endpoint` - LocalAI server URL (default: `http://localhost:8080`)
- `localai.apiKey` - API key if your LocalAI requires authentication
- `localai.chatModel` - Specific model for chat (leave empty for default)
- `localai.completionModel` - Specific model for completions (leave empty for default)
- `localai.maxTokens` - Maximum tokens for responses (default: 2048)
- `localai.temperature` - Temperature for generation (default: 0.7)
- `localai.enableCompletion` - Enable/disable code completion (default: true)
- `localai.completionDelay` - Delay before triggering completion in ms (default: 500)

### 3. Test Connection

Run the command:

```
LocalAI: Test Connection
```

You should see "✓ Successfully connected to LocalAI" if everything is configured correctly.

## Usage

### Chat Interface

1. Open the chat panel in VSCode (usually on the side or bottom)
2. Type `@localai` followed by your question or request
3. Press Enter to send

**Example:**

```
@localai how do I reverse a string in JavaScript?
```

### Chat Commands

Select code in your editor and use specialized commands:

```
@localai /explain
```

This will explain the selected code in detail.

**Available commands:**
- `/explain` - Get detailed explanation of selected code
- `/fix` - Identify and fix bugs in selected code
- `/optimize` - Suggest performance improvements
- `/document` - Generate documentation comments
- `/test` - Create unit tests for the code

### Code Completion

Simply start typing in any file. The extension will automatically suggest completions based on your code context.

**Tips:**
- Completions appear after a short delay (configurable)
- Press `Tab` to accept a suggestion
- Press `Esc` to dismiss

**Toggle completions:**

```
LocalAI: Toggle Code Completion
```

## Recommended Models

For best results, use models optimized for code:

### For Chat:
- **CodeLlama** - Excellent for code explanations and generation
- **Mistral** - Good general-purpose coding assistant
- **Deepseek Coder** - Specialized for coding tasks
- **Phi-3** - Lightweight and fast

### For Completion:
- **StarCoder** - Trained specifically for code completion
- **CodeLlama (smaller variants)** - Fast and accurate
- **Deepseek Coder Base** - Good completion quality

### Loading Models in LocalAI

```bash
# Example: Load CodeLlama with LocalAI gallery
curl http://localhost:8080/models/apply -H "Content-Type: application/json" -d '{
  "id": "huggingface@thebloke/codellama-7b-instruct-gguf"
}'
```

Check the [LocalAI Gallery](https://github.com/mudler/LocalAI/tree/master/gallery) for more models.

## Configuration Examples

### Basic Setup (Local)

```json
{
  "localai.endpoint": "http://localhost:8080",
  "localai.enableCompletion": true
}
```

### Remote Server with Authentication

```json
{
  "localai.endpoint": "https://my-localai-server.com",
  "localai.apiKey": "your-api-key-here",
  "localai.chatModel": "codellama-7b-instruct",
  "localai.completionModel": "starcoder-3b"
}
```

### Performance Tuning

```json
{
  "localai.temperature": 0.3,
  "localai.maxTokens": 1024,
  "localai.completionDelay": 800
}
```

## Troubleshooting

### Cannot Connect to LocalAI

1. Verify LocalAI is running: `curl http://localhost:8080/v1/models`
2. Check the endpoint URL in settings
3. Ensure no firewall is blocking the connection
4. Run: `LocalAI: Test Connection`

### No Completions Appearing

1. Check if completion is enabled: `localai.enableCompletion`
2. Verify a model is loaded in LocalAI
3. Increase `localai.completionDelay` if completions appear too early
4. Check VSCode's Output panel (select "LocalAI" from dropdown) for errors

### Slow Responses

1. Use smaller, faster models for completions
2. Reduce `localai.maxTokens`
3. Ensure LocalAI has adequate system resources
4. Consider using GPU acceleration in LocalAI

### Chat Not Working

1. Ensure you're using `@localai` prefix in chat
2. Verify LocalAI endpoint is correct
3. Check that a chat-compatible model is loaded
4. Try: `LocalAI: Configure Endpoint`

## Performance Tips

- **Use different models** for chat vs. completion (smaller for completion)
- **Adjust completion delay** based on your typing speed
- **Lower temperature** (0.2-0.4) for more deterministic code suggestions
- **Higher temperature** (0.7-0.9) for creative chat responses
- **Reduce max tokens** for faster completion responses

## Privacy & Security

- All AI processing happens on your LocalAI instance
- No data is sent to external services
- API keys are stored in VSCode's secure settings storage
- Code never leaves your control

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.

## Links

- [LocalAI Project](https://github.com/mudler/LocalAI)
- [LocalAI Documentation](https://localai.io)
- [Report Issues](https://github.com/weatherills/LocalAI-vscode/issues)

## Acknowledgments

Built on top of the amazing [LocalAI](https://github.com/mudler/LocalAI) project by Ettore Di Giacinto and contributors.
