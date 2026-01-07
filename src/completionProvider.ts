import * as vscode from 'vscode';
import { LocalAIClient, getLocalAIClient } from './localaiClient';

export class LocalAICompletionProvider implements vscode.InlineCompletionItemProvider {
    private client: LocalAIClient;
    private debounceTimer: NodeJS.Timeout | undefined;
    private lastTriggerTime = 0;

    constructor() {
        this.client = getLocalAIClient();

        // Update client when configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('localai')) {
                this.client = getLocalAIClient();
            }
        });
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | undefined> {
        const config = vscode.workspace.getConfiguration('localai');

        // Check if completion is enabled
        if (!config.get('enableCompletion', true)) {
            return undefined;
        }

        // Debounce requests
        const delay = config.get('completionDelay', 500);
        const now = Date.now();
        if (now - this.lastTriggerTime < delay) {
            return undefined;
        }
        this.lastTriggerTime = now;

        try {
            // Build context
            const prompt = this.buildPrompt(document, position);

            if (!prompt || prompt.trim().length === 0) {
                return undefined;
            }

            // Request completion
            const completion = await this.client.complete({
                prompt,
                maxTokens: 150,
                temperature: 0.3,
                stop: ['\n\n', '<|endoftext|>', '```']
            });

            if (token.isCancellationRequested || !completion) {
                return undefined;
            }

            // Clean up completion
            const cleanedCompletion = this.cleanCompletion(completion);

            if (!cleanedCompletion) {
                return undefined;
            }

            return [
                new vscode.InlineCompletionItem(
                    cleanedCompletion,
                    new vscode.Range(position, position)
                )
            ];
        } catch (error) {
            // Silently fail - don't interrupt user's workflow
            console.error('LocalAI completion error:', error);
            return undefined;
        }
    }

    private buildPrompt(document: vscode.TextDocument, position: vscode.Position): string {
        const lineCount = document.lineCount;
        const currentLine = position.line;

        // Get lines before cursor (with limit)
        const beforeLines = Math.max(0, currentLine - 50);
        const beforeRange = new vscode.Range(beforeLines, 0, currentLine, position.character);
        const beforeText = document.getText(beforeRange);

        // Get lines after cursor (with limit)
        const afterLines = Math.min(lineCount, currentLine + 10);
        const afterRange = new vscode.Range(position.line, position.character, afterLines, 0);
        const afterText = document.getText(afterRange);

        // Build prompt with language context
        const language = document.languageId;
        const fileName = document.fileName.split(/[\\/]/).pop() || '';

        let prompt = `# Language: ${language}\n# File: ${fileName}\n\n`;

        // Add context
        prompt += beforeText;
        prompt += '<CURSOR>';

        // Add a bit of after context to help with better predictions
        if (afterText.trim().length > 0) {
            const firstLine = afterText.split('\n')[0];
            if (firstLine.trim().length > 0) {
                prompt += '\n# Next line: ' + firstLine.trim();
            }
        }

        return prompt;
    }

    private cleanCompletion(completion: string): string {
        // Remove cursor marker if present
        completion = completion.replace('<CURSOR>', '');

        // Trim whitespace
        completion = completion.trim();

        // Remove markdown code blocks if present
        completion = completion.replace(/```[\w]*\n?/g, '');

        // Take only the first logical completion (stop at double newline or obvious breaks)
        const lines = completion.split('\n');
        const result: string[] = [];
        let emptyLineCount = 0;

        for (const line of lines) {
            if (line.trim().length === 0) {
                emptyLineCount++;
                if (emptyLineCount > 1) {
                    break;
                }
            } else {
                emptyLineCount = 0;
            }
            result.push(line);
        }

        return result.join('\n');
    }
}

export function registerCompletionProvider(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('localai');

    if (!config.get('enableCompletion', true)) {
        return;
    }

    const provider = new LocalAICompletionProvider();

    // Register for all languages
    const disposable = vscode.languages.registerInlineCompletionItemProvider(
        { pattern: '**' },
        provider
    );

    context.subscriptions.push(disposable);
}
