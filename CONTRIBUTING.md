# Contributing to LocalAI VSCode Extension

Thank you for your interest in contributing to the LocalAI VSCode Extension!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/weatherills/LocalAI-vscode.git
   cd LocalAI-vscode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Open in VSCode:
   ```bash
   code .
   ```

4. Press F5 to open a new VSCode window with the extension loaded

## Project Structure

```
LocalAI-vscode/
├── src/
│   ├── extension.ts           # Main extension entry point
│   ├── chatParticipant.ts     # Chat integration implementation
│   ├── completionProvider.ts  # Code completion provider
│   └── localaiClient.ts       # LocalAI API client
├── package.json               # Extension manifest
├── tsconfig.json             # TypeScript configuration
└── README.md                 # User documentation
```

## Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory

3. Compile TypeScript:
   ```bash
   npm run compile
   ```

4. Test your changes by pressing F5 in VSCode

5. Run linting:
   ```bash
   npm run lint
   ```

## Testing

- Manual testing: Press F5 to launch the Extension Development Host
- Test the chat by typing `@localai` in the chat panel
- Test completions by typing in any code file
- Test commands from the command palette

## Code Style

- Use 4 spaces for indentation
- Follow existing code patterns
- Add comments for complex logic
- Use TypeScript types wherever possible

## Submitting Changes

1. Commit your changes:
   ```bash
   git commit -m "Add: brief description of changes"
   ```

2. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request on GitHub

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure the code compiles without errors
- Test thoroughly before submitting

## Feature Ideas

Some areas where contributions would be welcome:

- Additional chat commands
- Improved completion context
- Settings UI improvements
- Multi-model support
- Telemetry and analytics (opt-in)
- More language-specific optimizations
- Better error handling and user feedback

## Questions?

Open an issue on GitHub if you have questions or need help!
