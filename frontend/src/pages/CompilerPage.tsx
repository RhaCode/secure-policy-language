// frontend/src/pages/CompilerPage.tsx
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Shield, Download, CheckCircle, Bug, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';
import CodeEditor from '../components/CodeEditor';
import CompilerOutput from '../components/CompilerOutput';
import RiskReport from '../components/RiskReport';
import DebugPanel from '../components/DebugPanel';
import type { CompilationResponse, SecurityAnalysisResponse, CompilationError, ParsingError, ValidateResponse } from '../types';

const SAMPLE_CODE = `ROLE Admin { can: * }

ROLE Developer { can: read, write }

RESOURCE DB_Finance { path: "/data/financial" }

ALLOW action: read, write ON RESOURCE: DB_Finance
IF (user.role == "Developer" AND time.hour >= 9 AND time.hour <= 17)

DENY action: delete ON RESOURCE: DB_Finance
IF (user.role == "Developer")

USER Alice { role: Admin }

USER Bob { role: Developer }`;

export default function CompilerPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [code, setCode] = useState(SAMPLE_CODE);
  const [compilationResult, setCompilationResult] = useState<CompilationResponse | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysisResponse | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [activeTab, setActiveTab] = useState<'compilation' | 'security' | 'debug'>('compilation');

  // Extract compiled policy for execution
  const compiledPolicy = useMemo(() => {
    if (compilationResult?.success && compilationResult.stages?.code_generation?.generated_code) {
      try {
        return JSON.parse(compilationResult.stages.code_generation.generated_code);
      } catch {
        return null;
      }
    }
    return null;
  }, [compilationResult]);

  const errors = useMemo(() => {
    if (!compilationResult) return [];
    
    const allErrors: CompilationError[] = [];
    
    if (!compilationResult.success && compilationResult.stages?.parsing?.errors) {
      const parsingErrors = compilationResult.stages.parsing.errors;
      if (Array.isArray(parsingErrors)) {
        parsingErrors.forEach((error: ParsingError) => {
          allErrors.push({ 
            line: error.line || 1, 
            message: error.message, 
            type: error.type || 'ERROR' 
          });
        });
      }
    }
    
    if (compilationResult.stages?.semantic_analysis) {
      compilationResult.stages.semantic_analysis.errors?.forEach((error) => {
        allErrors.push({ 
          line: error.line || 1, 
          message: error.message, 
          type: error.type 
        });
      });
      
      compilationResult.stages.semantic_analysis.warnings?.forEach((warning) => {
        allErrors.push({ 
          line: warning.line || 1, 
          message: warning.message, 
          type: warning.type 
        });
      });
    }
    
    return allErrors;
  }, [compilationResult]);

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    try {
      const result = await apiService.compileSPL(code, true, true, 'json');
      setCompilationResult(result);
      setActiveTab('compilation');
    } catch (error) {
      console.error('Compilation failed:', error);
      setCompilationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Compilation failed',
        stages: { 
          tokenization: { 
            success: false, 
            token_count: 0, 
            tokens: [] 
          }, 
          parsing: { 
            success: false, 
            errors: [] 
          } 
        }
      });
    } finally {
      setIsCompiling(false);
    }
  }, [code]);

  const handleSecurityAnalysis = useCallback(async () => {
    setIsAnalyzingSecurity(true);
    try {
      const result = await apiService.analyzeSecurity(code);
      setSecurityAnalysis(result);
      setActiveTab('security');
    } catch (error) {
      console.error('Security analysis failed:', error);
      setSecurityAnalysis({
        success: false,
        error: error instanceof Error ? error.message : 'Security analysis failed',
        security_analysis: { risks: [], risk_score: 0, recommendations: [] },
        provider: 'azure'
      });
    } finally {
      setIsAnalyzingSecurity(false);
    }
  }, [code]);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = await apiService.validateSPL(code);
      setValidationResult(result);
      setActiveTab('debug');
      
      if (result.valid) {
        console.log('✓ Code is valid');
      } else {
        console.error('Validation errors found:', result.errors);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        errors: []
      });
    } finally {
      setIsValidating(false);
    }
  }, [code]);

  const handleDebug = useCallback(async () => {
    setIsDebugging(true);
    try {
      const [tokenResult, parseResult, semanticResult] = await Promise.all([
        apiService.debugTokens(code),
        apiService.parseSPL(code).catch(() => ({ success: false, ast: null, errors: [] })),
        apiService.analyzeSemantics(code).catch(() => ({ 
          success: false, 
          errors: [], 
          warnings: [], 
          conflicts: [], 
          statistics: {} 
        }))
      ]);

      setDebugData({
        tokens: tokenResult,
        parsing: parseResult,
        semantic: semanticResult
      });
      setActiveTab('debug');
    } catch (error) {
      console.error('Debug failed:', error);
      setDebugData({
        error: error instanceof Error ? error.message : 'Debug failed'
      });
      setActiveTab('debug');
    } finally {
      setIsDebugging(false);
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    if (compilationResult?.stages.code_generation?.generated_code) {
      const blob = new Blob([compilationResult.stages.code_generation.generated_code], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spl-policy.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [compilationResult]);

  const handleExecute = useCallback(async () => {
    if (compiledPolicy) {
      // Store compiled policy in sessionStorage for execution page
      sessionStorage.setItem('compiledPolicy', JSON.stringify(compiledPolicy));
      sessionStorage.setItem('sourceCode', code);
      navigate('/execution');
    }
  }, [compiledPolicy, code, navigate]);

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} border-b px-4 py-3`}>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md hover:shadow-lg
              ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
          >
            <CheckCircle size={16} />
            {isValidating ? 'Validating...' : 'Validate'}
          </button>

          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md hover:shadow-lg
              ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
          >
            <Play size={16} />
            {isCompiling ? 'Compiling...' : 'Compile'}
          </button>

          <button
            onClick={handleSecurityAnalysis}
            disabled={isAnalyzingSecurity}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md hover:shadow-lg
              ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]'}`}
          >
            <Shield size={16} />
            {isAnalyzingSecurity ? 'Scanning...' : 'Scan'}
          </button>

          <button
            onClick={handleDebug}
            disabled={isDebugging}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md hover:shadow-lg
              ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
          >
            <Bug size={16} />
            {isDebugging ? 'Debugging...' : 'Debug'}
          </button>

          {compiledPolicy && (
            <button
              onClick={handleExecute}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 
                active:scale-95 shadow-md hover:shadow-lg bg-[#10B981] text-white hover:bg-[#059669]`}
            >
              <Zap size={16} />
              Execute Policy
            </button>
          )}

          {compilationResult?.stages?.code_generation && (
            <button
              onClick={handleDownload}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 
                active:scale-95 shadow-md hover:shadow-lg text-sm
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
            >
              <Download size={16} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Panel - Code Editor (60%) */}
        <div className="h-3/5 min-h-0">
          <CodeEditor
            code={code}
            onCodeChange={setCode}
            errors={errors}
            className="h-full"
          />
        </div>

        {/* Bottom Panel - Results (40%) */}
        <div className="h-2/5 min-h-0 flex flex-col">
          {/* Tabs */}
          <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} border-b flex`}>
            <button
              onClick={() => setActiveTab('compilation')}
              className={`flex-1 px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'compilation'
                  ? isDark ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30' : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
                  : isDark ? 'text-[#6B7280] hover:text-[#A1A1AA]' : 'text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
            >
              Compilation
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'security'
                  ? isDark ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30' : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
                  : isDark ? 'text-[#6B7280] hover:text-[#A1A1AA]' : 'text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('debug')}
              className={`flex-1 px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'debug'
                  ? isDark ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30' : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
                  : isDark ? 'text-[#6B7280] hover:text-[#A1A1AA]' : 'text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
            >
              Debug
            </button>
          </div>

          {/* Results Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'compilation' ? (
              <CompilerOutput
                compilationResult={compilationResult}
                isLoading={isCompiling}
                className="h-full"
              />
            ) : activeTab === 'security' ? (
              <RiskReport
                securityAnalysis={securityAnalysis}
                className="h-full"
              />
            ) : (
              <DebugPanel
                debugData={debugData}
                isLoading={isDebugging}
                validationResult={validationResult}
                className="h-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}