// frontend/src/services/api.ts
import type { 
  CompilationResponse, 
  SemanticAnalysisResponse, 
  TokenizeResponse,
  ParseResponse,
  ValidateResponse,
  AccessCheckContext,
  AccessCheckResult,
  UserInfo,
  ResourceInfo,
  PolicyInfo,
  AuditLog,
  AccessStatistics
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

  async compileSPL(
    code: string, 
    analyze: boolean = false, 
    generateCode: boolean = false, 
    format: string = 'json'
  ): Promise<CompilationResponse> {
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

  // ⭐ FIXED: correct Gemini endpoint + correct payload
  async analyzeSecurity(code: string) {
    return this.fetchWithErrorHandling(`${API_BASE}/llm/analyze-policy`, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async healthCheck(): Promise<{ status: string; compiler: string }> {
    return this.fetchWithErrorHandling(`${API_BASE}/health`);
  }

  // ============ EXECUTION ENGINE METHODS ============

  async checkAccess(
    username: string, 
    action: string, 
    resource: string, 
    context?: Partial<AccessCheckContext>
  ): Promise<AccessCheckResult> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/check-access`, {
      method: 'POST',
      body: JSON.stringify({ username, action, resource, context }),
    });
  }

  async getUserPermissions(username: string): Promise<any> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/user-permissions/${username}`);
  }

  // ============ READ-ONLY DATA ENDPOINTS ============

  async getUsers(): Promise<{ success: boolean; users: UserInfo[]; count: number }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users`);
  }

  async getUser(username: string): Promise<{ success: boolean; user: UserInfo }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/users/${username}`);
  }

  async getResources(): Promise<{ success: boolean; resources: ResourceInfo[]; count: number }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources`);
  }

  async getResource(name: string): Promise<{ success: boolean; resource: ResourceInfo }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/resources/${encodeURIComponent(name)}`);
  }

  async getPolicies(): Promise<PolicyInfo[]> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies`);
  }

  async getPolicyDetails(policyId: number): Promise<{ success: boolean; policy: any }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies/${policyId}`);
  }

  async getPolicyHistory(name: string): Promise<{ 
    success: boolean; 
    policy_name: string; 
    versions: any[]; 
    total_versions: number 
  }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies/${encodeURIComponent(name)}/history`);
  }

  async getActivePolicySourceCode(): Promise<{ 
    success: boolean; 
    source_code: string; 
    policy_name: string; 
    policy_version: number 
  }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/policies/source`);
  }

  // ============ AUDIT LOGS & STATISTICS ============

  async getAuditLogs(
    username?: string, 
    resource?: string, 
    limit: number = 100
  ): Promise<{ success: boolean; logs: AuditLog[]; count: number }> {
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (resource) params.append('resource', resource);
    params.append('limit', limit.toString());
    
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/audit-logs?${params.toString()}`);
  }

  async getStatistics(): Promise<{ 
    success: boolean; 
    statistics: {
      users: { total: number; active: number };
      resources: { total: number };
      policies: { total: number };
      access_logs: AccessStatistics;
    }
  }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/statistics`);
  }

  async executionHealthCheck(): Promise<{ 
    status: string; 
    database: string; 
    policy_engine: string 
  }> {
    return this.fetchWithErrorHandling(`${EXECUTION_BASE}/health`);
  }
}

export const apiService = new ApiService();

// ⭐ FIXED: Correct bottom helper function
export async function scanWithLLM(code: string) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/llm/analyze-policy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_code: code }),
    }
  );

  return response.json();
}
