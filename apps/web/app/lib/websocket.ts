export type WebSocketHandler = (payload: any) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private handlers: Map<string, Set<WebSocketHandler>> = new Map();
    private url: string = '';
    private reconnectInterval: number = 3000;
    private shouldReconnect: boolean = true;
    private isConnected: boolean = false;

    connect(url: string): Promise<void> {
        this.url = url;
        this.shouldReconnect = true;

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        const { type, payload } = message;
                        this.emit(type, payload);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.isConnected = false;
                    if (this.shouldReconnect) {
                        setTimeout(() => this.connect(this.url), this.reconnectInterval);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    if (!this.isConnected) {
                        reject(error);
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(type: string, payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        } else {
            console.warn('WebSocket is not connected. Message not sent:', type);
        }
    }

    on(type: string, handler: WebSocketHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)?.add(handler);
    }

    off(type: string, handler: WebSocketHandler) {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.delete(handler);
            if (typeHandlers.size === 0) {
                this.handlers.delete(type);
            }
        }
    }

    private emit(type: string, payload: any) {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.forEach(handler => handler(payload));
        }
    }
}

export const wsClient = new WebSocketClient();
