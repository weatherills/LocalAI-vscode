import * as vscode from 'vscode';
import { LocalAIClient, getLocalAIClient, ChatMessage } from './localaiClient';

const PARTICIPANT_ID = 'localai.chat';

export class LocalAIChatParticipant {
    private client: LocalAIClient;

    constructor(context: vscode.ExtensionContext) {
        this.client = getLocalAIClient();

        // Update client when configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('localai')) {
                this.client = getLocalAIClient();
            }
        });

        // Register chat participant
        const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, this.handleChatRequest.bind(this));
        participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

        context.subscriptions.push(participant);
    }

    private async handleChatRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        try {
            // Test connection first
            const isConnected = await this.client.testConnection();
            if (!isConnected) {
                stream.markdown('⚠️ Cannot connect to LocalAI server. Please check your configuration.\n\n');
                stream.markdown('Current endpoint: `' + vscode.workspace.getConfiguration('localai').get('endpoint') + '`\n\n');
                stream.markdown('You can update the endpoint in your settings: `localai.endpoint`');
                return { metadata: { command: request.command } };
            }

            // Build message history from context
            const messages: ChatMessage[] = this.buildMessageHistory(context, request);

            // Handle specific commands
            if (request.command) {
                return await this.handleCommand(request, messages, stream, token);
            }

            // Regular chat
            let fullResponse = '';

            for await (const chunk of this.client.chatStream(messages)) {
                if (token.isCancellationRequested) {
                    break;
                }
                fullResponse += chunk;
                stream.markdown(chunk);
            }

            return { metadata: { command: request.command } };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            stream.markdown(`\n\n⚠️ Error: ${errorMessage}`);
            return { metadata: { command: request.command }, errorDetails: { message: errorMessage } };
        }
    }

    private buildMessageHistory(context: vscode.ChatContext, request: vscode.ChatRequest): ChatMessage[] {
        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: 'You are a helpful AI assistant integrated into Visual Studio Code. You help developers with coding tasks, explanations, and problem-solving.'
            }
        ];

        // Add conversation history
        for (const turn of context.history) {
            if (turn instanceof vscode.ChatRequestTurn) {
                messages.push({
                    role: 'user',
                    content: turn.prompt
                });
            } else if (turn instanceof vscode.ChatResponseTurn) {
                const response = turn.response.map(part => {
                    if (part instanceof vscode.ChatResponseMarkdownPart) {
                        return part.value.value;
                    }
                    return '';
                }).join('');

                if (response) {
                    messages.push({
                        role: 'assistant',
                        content: response
                    });
                }
            }
        }

        // Add current request with context
        let userMessage = request.prompt;

        // Add code selection context if available
        const editor = vscode.window.activeTextEditor;
        if (editor && !editor.selection.isEmpty) {
            const selection = editor.document.getText(editor.selection);
            const language = editor.document.languageId;
            userMessage = `Selected code (${language}):\n\`\`\`${language}\n${selection}\n\`\`\`\n\n${userMessage}`;
        }

        messages.push({
            role: 'user',
            content: userMessage
        });

        return messages;
    }

    private async handleCommand(
        request: vscode.ChatRequest,
        messages: ChatMessage[],
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.selection.isEmpty) {
            stream.markdown('⚠️ Please select some code first.');
            return { metadata: { command: request.command } };
        }

        const selection = editor.document.getText(editor.selection);
        const language = editor.document.languageId;

        // Modify the user message based on command
        let commandPrompt = '';

        switch (request.command) {
            case 'explain':
                commandPrompt = `Explain the following ${language} code in detail:\n\`\`\`${language}\n${selection}\n\`\`\``;
                break;
            case 'fix':
                commandPrompt = `Analyze the following ${language} code and fix any bugs or issues:\n\`\`\`${language}\n${selection}\n\`\`\`\n\nProvide the corrected code and explain what was wrong.`;
                break;
            case 'optimize':
                commandPrompt = `Optimize the following ${language} code for better performance and readability:\n\`\`\`${language}\n${selection}\n\`\`\`\n\nProvide the optimized code and explain the improvements.`;
                break;
            case 'document':
                commandPrompt = `Generate comprehensive documentation for the following ${language} code:\n\`\`\`${language}\n${selection}\n\`\`\`\n\nInclude function/class descriptions, parameters, return values, and usage examples.`;
                break;
            case 'test':
                commandPrompt = `Generate unit tests for the following ${language} code:\n\`\`\`${language}\n${selection}\n\`\`\`\n\nProvide complete test cases covering various scenarios.`;
                break;
            default:
                commandPrompt = request.prompt;
        }

        // Update the last message
        messages[messages.length - 1].content = commandPrompt;

        // Stream response
        for await (const chunk of this.client.chatStream(messages)) {
            if (token.isCancellationRequested) {
                break;
            }
            stream.markdown(chunk);
        }

        return { metadata: { command: request.command } };
    }
}
