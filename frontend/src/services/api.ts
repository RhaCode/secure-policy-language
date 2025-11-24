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
const CRUD_BASE = `${API_BASE}/crud`;

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

      // For compilation, we now accept 200 responses even with parsing errors
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

  async debugTokens(code: string): Promise<{ tokens: any[]; total_tokens: number }> {
    return this.fetchWithErrorHandling(`${API_BASE}/debug-tokens`, {
      method: 'POST',
      body: JSON.stringify({ code }),
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

  async activatePolicy(name: string, sourceCode: string, compiledJson: any, createdBy?: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/activate-policy`, {
      method: 'POST',
      body: JSON.stringify({ 
        name, 
        source_code: sourceCode, 
        compiled_json: compiledJson,
        created_by: createdBy 
      }),
    });
  }

  async getUserPermissions(username: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/user-permissions/${username}`);
  }

  async getPolicies(): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies`);
  }

  async getPolicyHistory(name: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies/${name}/history`);
  }

  // ============ USER MANAGEMENT (EXECUTION) ============

  async getUsers(): Promise<{ success: boolean; users: any[] }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users`);
  }

  async createUser(username: string, role: string, email?: string, department?: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify({ username, role, email, department }),
    });
  }

  async getUser(username: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users/${username}`);
  }

  async updateUser(username: string, data: any): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(username: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users/${username}`, {
      method: 'DELETE',
    });
  }

  // ============ RESOURCE MANAGEMENT (EXECUTION) ============

  async getResources(): Promise<{ success: boolean; resources: any[] }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources`);
  }

  async createResource(name: string, type: string, path: string, description?: string, owner?: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources`, {
      method: 'POST',
      body: JSON.stringify({ name, type, path, description, owner }),
    });
  }

  async getResource(name: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources/${name}`);
  }

  async updateResource(name: string, data: any): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResource(name: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources/${name}`, {
      method: 'DELETE',
    });
  }

  // ============ AUDIT LOGS ============

  async getAuditLogs(username?: string, resource?: string, limit: number = 100): Promise<any> {
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (resource) params.append('resource', resource);
    params.append('limit', limit.toString());
    
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/audit-logs?${params.toString()}`);
  }

  async getStatistics(): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/statistics`);
  }

  // ============ HEALTH CHECK ============

  async executionHealthCheck(): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/health`);
  }

  // ============ CRUD MANAGEMENT METHODS ============

  // Users CRUD
  async getUsersCRUD(): Promise<{ success: boolean; data: any[] }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/users`);
  }

  async createUserCRUD(username: string, role: string, email?: string, department?: string): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify({ username, role, email, department }),
    });
  }

  async getUserCRUD(username: string): Promise<{ success: boolean; data: any }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/users/${username}`);
  }

  async updateUserCRUD(username: string, data: any): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUserCRUD(username: string): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/users/${username}`, {
      method: 'DELETE',
    });
  }

  // Resources CRUD
  async getResourcesCRUD(): Promise<{ success: boolean; data: any[] }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/resources`);
  }

  async createResourceCRUD(name: string, type: string, path: string, description?: string, owner?: string): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/resources`, {
      method: 'POST',
      body: JSON.stringify({ name, type, path, description, owner }),
    });
  }

  async getResourceCRUD(name: string): Promise<{ success: boolean; data: any }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/resources/${name}`);
  }

  async updateResourceCRUD(name: string, data: any): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/resources/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResourceCRUD(name: string): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/resources/${name}`, {
      method: 'DELETE',
    });
  }

  // Policies CRUD
  async getPoliciesCRUD(): Promise<{ success: boolean; data: any }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/policies`);
  }

  async getPolicyCRUD(policyId: number): Promise<{ success: boolean; data: any }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/policies/${policyId}`);
  }

  async getPolicyHistoryCRUD(name: string): Promise<{ success: boolean; data: any }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/policies/history/${name}`);
  }

  async activatePolicyCRUD(policyId: number): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/policies/${policyId}/activate`, {
      method: 'POST',
    });
  }

  async deletePolicyCRUD(policyId: number): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/policies/${policyId}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getStatisticsCRUD(): Promise<{ success: boolean; data: any }> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/statistics`);
  }

  // Health Check
  async crudHealthCheck(): Promise<any> {
    return this.fetchWithErrorHandling(`${CRUD_BASE}/health`);
  }
}

export const apiService = new ApiService();