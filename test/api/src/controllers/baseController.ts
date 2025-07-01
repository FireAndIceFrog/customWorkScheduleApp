export class BaseController {
    constructor(
        protected baseUrl: string,
        protected apiKey: string,
        protected headers: Record<string, string> = {}
    ) {}
    
    protected async fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...this.headers,
        },
        });
    
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        return response.json();
    }
}