// frontend/src/types.ts

// ============================================================================
// CONTEXT TYPES (NEW - for IP and Device support)
// ============================================================================

export interface TimeContext {
  hour: number;
  minute: number;
  day?: number;
  month?: number;
  year?: number;
  weekday?: number;
}

export interface RequestContext {
  ip: string;
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  user_agent?: string;
}

export interface DeviceContext {
  type: string;
  trusted: boolean;
  os: string;
  browser: string;
  location: string;
  id?: string;
}

export interface AccessCheckContext {
  time: TimeContext;
  request: RequestContext;
  device: DeviceContext;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface Token {
  type: string;
  value: string;
  line: number;
}

export interface CompilationWarning {
  type: string;
  message: string;
  line?: number;
}

export interface PolicyConflict {
  type: string;
  description: string;
  risk_score: number;
  policy1_line?: number;
  policy2_line?: number;
}

export interface CompilationStatistics {
  roles_defined?: number;
  users_defined?: number;
  resources_defined?: number;
  policies_defined?: number;
  conflicts_found?: number;
  undefined_references?: number;
  security_risks?: number;
}

export interface ParsingError {
  line: number;
  message: string;
  type: string;
}

export interface TokenizationStage {
  success: boolean;
  token_count: number;
  tokens: Token[];
}

export interface ParsingStage {
  success: boolean;
  ast?: string;
  errors: ParsingError[];
}

export interface SemanticAnalysisStage {
  success: boolean;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  conflicts: PolicyConflict[];
  statistics: CompilationStatistics;
}

export interface CodeGenerationStage {
  success: boolean;
  target_format: string;
  generated_code: string;
  supported_formats: string[];
}

export interface SemanticAnalysisResponse {
  success: boolean;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  conflicts: PolicyConflict[];
  statistics: CompilationStatistics;
  security_issues?: {
    wildcard_permissions: Array<[string, number]>;
    guest_delete_permissions: number;
    overly_permissive: number;
  };
}

export interface SecurityRisk {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface SecurityAnalysisData {
  risks: SecurityRisk[];
  risk_score: number;
  recommendations: string[];
}

export interface SecurityAnalysisResponse {
  success: boolean;
  security_analysis: SecurityAnalysisData;
  provider: string;
  error?: string;
}

export interface TokenizeResponse {
  success: boolean;
  tokens: Token[];
  token_count: number;
  error?: string;
}

export interface ParseResponse {
  success: boolean;
  ast: string;
  errors: string[];
  error?: string;
}

export interface CompilationResponse {
  success: boolean;
  stage?: string;
  error?: string;
  message?: string;
  errors?: CompilationError[];
  database_updated?: boolean;
  stages: {
    tokenization: TokenizationStage;
    parsing: ParsingStage;
    semantic_analysis?: SemanticAnalysisStage;
    code_generation?: CodeGenerationStage;
  };
}

export interface ValidateResponse {
  valid: boolean;
  stage?: string;
  errors: string[] | CompilationError[];
  warnings?: CompilationWarning[];
  conflicts?: PolicyConflict[];
  message?: string;
  error?: string;
}

export interface CompilationError {
  type: string;
  message: string;
  line?: number;
}

// ============================================================================
// EXECUTION ENGINE TYPES (NEW - for access control)
// ============================================================================

export interface UserInfo {
  username: string;
  role: string;
  email?: string;
  department?: string;
  active?: boolean;
}

export interface ResourceInfo {
  name: string;
  type: string;
  path: string;
  description?: string;
  owner?: string;
}

export interface PolicyInfo {
  id: number;
  name: string;
  version: number;
  created_at: string;
  active: boolean;
  created_by: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  matched_policies?: Array<{
    type: string;
    actions: string[];
    resource: string;
    condition?: string;
  }>;
  context?: {
    user: {
      name: string;
      role: string;
    };
    resource: {
      name: string;
    };
    time: TimeContext;
    request?: RequestContext;
    device?: DeviceContext;
  };
  error?: string;
}

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  resource: string;
  allowed: boolean;
  reason: string;
  ip_address?: string;
  timestamp: string;
}

export interface AccessStatistics {
  total_requests: number;
  allowed: number;
  denied: number;
  top_users?: Array<{ username: string; count: number }>;
  top_resources?: Array<{ resource: string; count: number }>;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  errors: CompilationError[];
  className?: string;
  onValidate?: () => void;
  onCompile?: () => void;
  onSecurityAnalysis?: () => void;
  onDebug?: () => void;
  onDownload?: () => void;
  onExecute?: () => void;
  isCompiling?: boolean;
  isAnalyzingSecurity?: boolean;
  isDebugging?: boolean;
  isValidating?: boolean;
  hasCompiledPolicy?: boolean;
}

export interface CompilerOutputProps {
  compilationResult: CompilationResponse | null;
  isLoading: boolean;
  className?: string;
}

export interface ErrorDisplayProps {
  errors: CompilationError[];
  className?: string;
}

export interface RiskReportProps {
  securityAnalysis: SecurityAnalysisResponse | null;
  className?: string;
}

export interface NavbarProps {
  className?: string;
}