import type { 
  CompilationResponse, 
  SemanticAnalysisResponse, 
  SecurityAnalysisResponse 
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  private async fetchWithErrorHandling(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async compileSPL(code: string, analyze: boolean = false, generateCode: boolean = false, format: string = 'json'): Promise<CompilationResponse> {
    return this.fetchWithErrorHandling(`${API_BASE}/compile`, {
      method: 'POST',
      body: JSON.stringify({ 
        code, 
        analyze, 
        generate_code: generateCode,
        format 
      }),
    });
  }

  async tokenizeSPL(code: string): Promise<{ tokens: any[]; token_count: number }> {
    return this.fetchWithErrorHandling(`${API_BASE}/tokenize`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async parseSPL(code: string): Promise<{ ast: string; errors: string[] }> {
    return this.fetchWithErrorHandling(`${API_BASE}/parse`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async validateSPL(code: string): Promise<{ valid: boolean; errors: string[] }> {
    return this.fetchWithErrorHandling(`${API_BASE}/validate`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async analyzeSemantics(code: string): Promise<SemanticAnalysisResponse> {
    return this.fetchWithErrorHandling(`${API_BASE}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async analyzeSecurity(code: string, provider: string = 'azure'): Promise<SecurityAnalysisResponse> {
    return this.fetchWithErrorHandling(`${API_BASE}/analyze-security`, {
      method: 'POST',
      body: JSON.stringify({ code, provider }),
    });
  }

  async healthCheck(): Promise<{ status: string; compiler: string }> {
    return this.fetchWithErrorHandling(`${API_BASE}/health`);
  }
}

export const apiService = new ApiService();