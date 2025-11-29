// frontend/src/services/api.ts
import type { 
  CompilationResponse, 
  SemanticAnalysisResponse, 
  SecurityAnalysisResponse,
  TokenizeResponse,
  ParseResponse,
  ValidateResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const EXECUTION_BASE = `${API_BASE}/execution`;

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

      // For compilation, we accept 200 responses even with parsing errors
      if (!response.ok && !url.includes('/compile')) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ============ COMPILER METHODS ============

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

  async tokenizeSPL(code: string): Promise<TokenizeResponse> {
    return this.fetchWithErrorHandling(`${API_BASE}/tokenize`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async parseSPL(code: string): Promise<ParseResponse> {
    return this.fetchWithErrorHandling(`${API_BASE}/parse`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async validateSPL(code: string): Promise<ValidateResponse> {
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

  // ============ EXECUTION ENGINE METHODS ============

  async checkAccess(username: string, action: string, resource: string, context?: any): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/check-access`, {
      method: 'POST',
      body: JSON.stringify({ username, action, resource, context }),
    });
  }

  async getUserPermissions(username: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/user-permissions/${username}`);
  }

  // ============ READ-ONLY DATA ENDPOINTS ============

  /**
   * Get all users defined in compiled policy
   * READ ONLY - Users are defined in SPL source code
   */
  async getUsers(): Promise<{ success: boolean; users: any[]; count: number }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users`);
  }

  /**
   * Get specific user information
   * READ ONLY
   */
  async getUser(username: string): Promise<{ success: boolean; user: any }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users/${username}`);
  }

  /**
   * Get all resources defined in compiled policy
   * READ ONLY - Resources are defined in SPL source code
   */
  async getResources(): Promise<{ success: boolean; resources: any[]; count: number }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources`);
  }

  /**
   * Get specific resource information
   * READ ONLY
   */
  async getResource(name: string): Promise<{ success: boolean; resource: any }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources/${name}`);
  }

  /**
   * Get active policy information
   * READ ONLY - Policy is defined in SPL source code
   */
  async getPolicies(): Promise<any[]> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies`);
  }

  /**
   * Get detailed information about a specific policy version
   * READ ONLY
   */
  async getPolicyDetails(policyId: number): Promise<{ success: boolean; policy: any }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies/${policyId}`);
  }

  /**
   * Get version history of a policy
   * READ ONLY
   */
  async getPolicyHistory(name: string): Promise<{ success: boolean; policy_name: string; versions: any[]; total_versions: number }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies/${name}/history`);
  }

  /**
   * Get source code for the active policy
   * READ ONLY
   */
  async getActivePolicySourceCode(): Promise<{ success: boolean; source_code: string; policy_name: string; policy_version: number }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies/source`);
  }

  // ============ AUDIT LOGS & STATISTICS ============

  async getAuditLogs(username?: string, resource?: string, limit: number = 100): Promise<{ success: boolean; logs: any[]; count: number }> {
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (resource) params.append('resource', resource);
    params.append('limit', limit.toString());
    
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/audit-logs?${params.toString()}`);
  }

  async getStatistics(): Promise<{ success: boolean; statistics: any }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/statistics`);
  }

  // ============ HEALTH CHECKS ============

  async executionHealthCheck(): Promise<{ status: string; database: string; policy_engine: string }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/health`);
  }
}

export const apiService = new ApiService();