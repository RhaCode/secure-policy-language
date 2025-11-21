// API Response Types
export interface Token {
  type: string;
  value: string;
  line: number;
}

export interface CompilationError {
  type: string;
  message: string;
  line?: number;
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

export interface CompilationStage {
  success: boolean;
  token_count?: number;
  tokens?: Token[];
  ast?: string;
  errors?: CompilationError[];
  warnings?: CompilationWarning[];
  conflicts?: PolicyConflict[];
  statistics?: CompilationStatistics;
}

export interface CodeGenerationStage {
  success: boolean;
  target_format: string;
  generated_code: string;
  supported_formats: string[];
}

export interface CompilationResponse {
  success: boolean;
  stages: {
    tokenization: CompilationStage;
    parsing: CompilationStage;
    semantic_analysis?: CompilationStage;
    code_generation?: CodeGenerationStage;
  };
  error?: string;
  stage?: string;
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

export interface ValidateResponse {
  valid: boolean;
  errors: string[];
  message?: string;
  error?: string;
}

// Component Props Types
export interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  errors: CompilationError[];
  className?: string;
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