import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export interface LocalAIConfig {
    endpoint: string;
    apiKey?: string;
    chatModel?: string;
    completionModel?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    stop?: string[];
}

export class LocalAIClient {
    private client: AxiosInstance;
    private config: LocalAIConfig;

    constructor(config: LocalAIConfig) {
        this.config = config;
        this.client = axios.create({
            baseURL: config.endpoint,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
            },
            timeout: 60000
        });
    }

    async chat(messages: ChatMessage[], stream: boolean = false): Promise<string> {
        try {
            const response = await this.client.post('/v1/chat/completions', {
                model: this.config.chatModel || 'gpt-3.5-turbo',
                messages,
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
                stream
            });

            if (response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }

            throw new Error('No response from LocalAI');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`LocalAI request failed: ${error.message}`);
            }
            throw error;
        }
    }

    async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
        try {
            const response = await this.client.post('/v1/chat/completions', {
                model: this.config.chatModel || 'gpt-3.5-turbo',
                messages,
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
                stream: true
            }, {
                responseType: 'stream'
            });

            const stream = response.data;
            let buffer = '';

            for await (const chunk of stream) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices?.[0]?.delta?.content) {
                                yield parsed.choices[0].delta.content;
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`LocalAI stream failed: ${error.message}`);
            }
            throw error;
        }
    }

    async complete(request: CompletionRequest): Promise<string> {
        try {
            const response = await this.client.post('/v1/completions', {
                model: this.config.completionModel || this.config.chatModel || 'gpt-3.5-turbo',
                prompt: request.prompt,
                max_tokens: request.maxTokens || this.config.maxTokens || 100,
                temperature: request.temperature || this.config.temperature || 0.3,
                stop: request.stop || ['\n\n', '<|endoftext|>']
            });

            if (response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].text;
            }

            throw new Error('No completion from LocalAI');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`LocalAI completion failed: ${error.message}`);
            }
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await this.client.get('/v1/models');
            return response.status === 200;
        } catch {
            return false;
        }
    }

    updateConfig(config: LocalAIConfig): void {
        this.config = config;
        this.client = axios.create({
            baseURL: config.endpoint,
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
            },
            timeout: 60000
        });
    }
}

export function getLocalAIClient(): LocalAIClient {
    const config = vscode.workspace.getConfiguration('localai');
    return new LocalAIClient({
        endpoint: config.get('endpoint') || 'http://localhost:8080',
        apiKey: config.get('apiKey') || undefined,
        chatModel: config.get('chatModel') || undefined,
        completionModel: config.get('completionModel') || undefined,
        maxTokens: config.get('maxTokens') || 2048,
        temperature: config.get('temperature') || 0.7
    });
}
