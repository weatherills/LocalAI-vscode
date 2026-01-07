import * as vscode from 'vscode';
import { LocalAIChatParticipant } from './chatParticipant';
import { registerCompletionProvider } from './completionProvider';
import { getLocalAIClient } from './localaiClient';

export async function activate(context: vscode.ExtensionContext) {
    console.log('LocalAI extension is now active');

    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        showWelcomeMessage(context);
        context.globalState.update('hasShownWelcome', true);
    }

    // Initialize chat participant with error handling
    try {
        if (vscode.chat && typeof vscode.chat.createChatParticipant === 'function') {
            new LocalAIChatParticipant(context);
            console.log('LocalAI chat participant registered successfully');
        } else {
            console.error('VSCode Chat API not available. Chat participant not registered.');
            vscode.window.showWarningMessage(
                'LocalAI Chat: VSCode Chat API is not available. Please ensure you have VSCode version 1.90 or later with GitHub Copilot Chat enabled.',
                'Learn More'
            ).then(selection => {
                if (selection === 'Learn More') {
                    vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/copilot/copilot-chat'));
                }
            });
        }
    } catch (error) {
        console.error('Failed to register chat participant:', error);
        vscode.window.showErrorMessage(
            `LocalAI Chat registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }

    // Initialize completion provider
    registerCompletionProvider(context);

    // Register commands
    registerCommands(context);

    // Test connection on startup
    testConnection();
}

export function deactivate() {
    console.log('LocalAI extension is now deactivated');
}

function registerCommands(context: vscode.ExtensionContext) {
    // Test connection command
    const testConnectionCommand = vscode.commands.registerCommand(
        'localai.testConnection',
        async () => {
            const client = getLocalAIClient();
            const isConnected = await client.testConnection();

            if (isConnected) {
                vscode.window.showInformationMessage('✓ Successfully connected to LocalAI');
            } else {
                const config = vscode.workspace.getConfiguration('localai');
                const endpoint = config.get('endpoint', 'http://localhost:8080');
                vscode.window.showErrorMessage(
                    `✗ Failed to connect to LocalAI at ${endpoint}. Please check your configuration.`
                );
            }
        }
    );

    // Configure endpoint command
    const configureEndpointCommand = vscode.commands.registerCommand(
        'localai.configureEndpoint',
        async () => {
            const config = vscode.workspace.getConfiguration('localai');
            const currentEndpoint = config.get('endpoint', 'http://localhost:8080');

            const newEndpoint = await vscode.window.showInputBox({
                prompt: 'Enter LocalAI server endpoint',
                value: currentEndpoint,
                placeHolder: 'http://localhost:8080'
            });

            if (newEndpoint) {
                await config.update('endpoint', newEndpoint, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`LocalAI endpoint updated to: ${newEndpoint}`);

                // Test new connection
                const client = getLocalAIClient();
                const isConnected = await client.testConnection();

                if (isConnected) {
                    vscode.window.showInformationMessage('✓ Successfully connected to LocalAI');
                } else {
                    vscode.window.showWarningMessage('⚠️ Cannot connect to LocalAI. Please verify the endpoint.');
                }
            }
        }
    );

    // Toggle completion command
    const toggleCompletionCommand = vscode.commands.registerCommand(
        'localai.toggleCompletion',
        async () => {
            const config = vscode.workspace.getConfiguration('localai');
            const currentValue = config.get('enableCompletion', true);
            await config.update('enableCompletion', !currentValue, vscode.ConfigurationTarget.Global);

            const status = !currentValue ? 'enabled' : 'disabled';
            vscode.window.showInformationMessage(`LocalAI code completion ${status}`);
        }
    );

    context.subscriptions.push(
        testConnectionCommand,
        configureEndpointCommand,
        toggleCompletionCommand
    );
}

async function testConnection() {
    try {
        const client = getLocalAIClient();
        const isConnected = await client.testConnection();

        if (!isConnected) {
            const config = vscode.workspace.getConfiguration('localai');
            const endpoint = config.get('endpoint', 'http://localhost:8080');

            const action = await vscode.window.showWarningMessage(
                `Cannot connect to LocalAI at ${endpoint}`,
                'Configure',
                'Ignore'
            );

            if (action === 'Configure') {
                vscode.commands.executeCommand('localai.configureEndpoint');
            }
        }
    } catch (error) {
        // Silently fail on startup
        console.error('LocalAI connection test failed:', error);
    }
}

function showWelcomeMessage(context: vscode.ExtensionContext) {
    const message = `Welcome to LocalAI! 🚀

This extension lets you chat with your local AI models and get code completions.

To get started:
1. Make sure LocalAI is running (default: http://localhost:8080)
2. Type @localai in the chat panel to start chatting
3. Code completions will appear automatically as you type

Configure settings with the command: "LocalAI: Configure Endpoint"`;

    vscode.window.showInformationMessage(message, 'Configure', 'Close').then(action => {
        if (action === 'Configure') {
            vscode.commands.executeCommand('localai.configureEndpoint');
        }
    });
}
