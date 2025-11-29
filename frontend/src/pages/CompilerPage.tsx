// frontend/src/pages/CompilerPage.tsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, PanelRightOpen, Play, Shield, Bug, Download, CheckCircle, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';
import CodeEditor from '../components/CodeEditor';
import CompilerOutput from '../components/CompilerOutput';
import RiskReport from '../components/RiskReport';
import DebugPanel from '../components/DebugPanel';
import ResizablePanel from '../components/ResizablePanel';
import type { CompilationResponse, SecurityAnalysisResponse, CompilationError, ParsingError, ValidateResponse } from '../types';

export default function CompilerPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [compilationResult, setCompilationResult] = useState<CompilationResponse | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysisResponse | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [activeTab, setActiveTab] = useState<'compilation' | 'security' | 'debug'>('compilation');
  const [isResultsVisible, setIsResultsVisible] = useState(false);

  // Load active policy on component mount
  useEffect(() => {
    const loadActivePolicy = async () => {
      try {
        const response = await apiService.getActivePolicySourceCode();
        if (response.success && response.source_code) {
          setCode(response.source_code);
          console.log(`✓ Loaded active policy: ${response.policy_name} v${response.policy_version}`);
        }
      } catch (error) {
        console.log('No active policy found - starting with empty editor');
      }
    };

    loadActivePolicy();
  }, []);

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
      if (!isResultsVisible) {
        setIsResultsVisible(true);
      }
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
  }, [code, isResultsVisible]);

  const handleSecurityAnalysis = useCallback(async () => {
    setIsAnalyzingSecurity(true);
    try {
      const result = await apiService.analyzeSecurity(code);
      setSecurityAnalysis(result);
      setActiveTab('security');
      if (!isResultsVisible) {
        setIsResultsVisible(true);
      }
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
  }, [code, isResultsVisible]);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = await apiService.validateSPL(code);
      setValidationResult(result);
      setActiveTab('debug');
      if (!isResultsVisible) {
        setIsResultsVisible(true);
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
  }, [code, isResultsVisible]);

const handleDebug = useCallback(async () => {
  setIsDebugging(true);
  try {
    const [tokenResult, semanticResult] = await Promise.all([
      apiService.tokenizeSPL(code),
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
      semantic: semanticResult
    });
    setActiveTab('debug');
    if (!isResultsVisible) {
      setIsResultsVisible(true);
    }
  } catch (error) {
    console.error('Debug failed:', error);
    setDebugData({
      error: error instanceof Error ? error.message : 'Debug failed'
    });
    setActiveTab('debug');
  } finally {
    setIsDebugging(false);
  }
}, [code, isResultsVisible]);

  const handleDownload = useCallback(() => {
    if (compilationResult?.success && compilationResult.stages?.code_generation?.generated_code) {
      try {
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
      } catch (error) {
        console.error('Download failed:', error);
        // Fallback: download the source code if generated code is not available
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spl-policy.spl';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } else {
      // Download source code if no compilation result
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spl-policy.spl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [compilationResult, code]);

  const handleExecute = useCallback(async () => {
    if (compiledPolicy) {
      sessionStorage.setItem('compiledPolicy', JSON.stringify(compiledPolicy));
      sessionStorage.setItem('sourceCode', code);
      navigate('/execution');
    }
  }, [compiledPolicy, code, navigate]);

  const toggleResultsVisibility = () => {
    setIsResultsVisible(!isResultsVisible);
  };

  const ResultsPanel = (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} border-b flex`}>
        <button
          onClick={() => setActiveTab('compilation')}
          className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'compilation'
              ? isDark ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30' : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
              : isDark ? 'text-[#6B7280] hover:text-[#A1A1AA]' : 'text-[#9CA3AF] hover:text-[#6B7280]'
          }`}
        >
          Compilation
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'security'
              ? isDark ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30' : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
              : isDark ? 'text-[#6B7280] hover:text-[#A1A1AA]' : 'text-[#9CA3AF] hover:text-[#6B7280]'
          }`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab('debug')}
          className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'debug'
              ? isDark ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30' : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
              : isDark ? 'text-[#6B7280] hover:text-[#A1A1AA]' : 'text-[#9CA3AF] hover:text-[#6B7280]'
          }`}
        >
          Debug
        </button>
        
        {/* Toggle Results Button */}
        <button
          onClick={toggleResultsVisibility}
          className={`px-3 py-2 text-sm font-medium transition-all ${
            isDark 
              ? 'text-[#6B7280] hover:text-[#A1A1AA] hover:bg-[#3F3F46]' 
              : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
          title={isResultsVisible ? 'Hide results' : 'Show results'}
        >
          {isResultsVisible ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
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
  );

  const EditorPanel = (
    <CodeEditor
      code={code}
      onCodeChange={setCode}
      errors={errors}
      className="h-full"
      onValidate={handleValidate}
      onCompile={handleCompile}
      onSecurityAnalysis={handleSecurityAnalysis}
      onDebug={handleDebug}
      onDownload={handleDownload}
      onExecute={handleExecute}
      isCompiling={isCompiling}
      isAnalyzingSecurity={isAnalyzingSecurity}
      isDebugging={isDebugging}
      isValidating={isValidating}
      hasCompiledPolicy={!!compiledPolicy}
    />
  );

  return (
    <div className="h-full flex flex-col">
      {/* Unified Header with Results Toggle and Action Buttons */}
      <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} border-b px-4 py-3`}>
        <div className="flex items-center justify-between">
          {/* Results Toggle */}
          <div className="flex items-center">
            <button
              onClick={toggleResultsVisibility}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isDark 
                  ? 'text-[#6B7280] hover:text-[#A1A1AA] hover:bg-[#3F3F46]' 
                  : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
              title={isResultsVisible ? 'Hide results panel' : 'Show results panel'}
            >
              <PanelRightOpen size={16} />
              <span className="hidden sm:inline">
                {isResultsVisible ? 'Hide Results' : 'Show Results'}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              title="Validate Policy"
            >
              <CheckCircle size={16} />
              <span className="hidden sm:inline">Validate</span>
            </button>

            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              title="Compile Policy"
            >
              <Play size={16} />
              <span className="hidden sm:inline">
                {isCompiling ? 'Compiling...' : 'Compile'}
              </span>
            </button>

            <button
              onClick={handleSecurityAnalysis}
              disabled={isAnalyzingSecurity}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]'}`}
              title="Security Analysis"
            >
              <Shield size={16} />
              <span className="hidden sm:inline">
                {isAnalyzingSecurity ? 'Scanning...' : 'Scan'}
              </span>
            </button>

            <button
              onClick={handleDebug}
              disabled={isDebugging}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              title="Debug Policy"
            >
              <Bug size={16} />
              <span className="hidden sm:inline">
                {isDebugging ? 'Debugging...' : 'Debug'}
              </span>
            </button>

            {compiledPolicy && (
              <button
                onClick={handleExecute}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  active:scale-95 bg-[#10B981] text-white hover:bg-[#059669]`}
                title="Execute Policy"
              >
                <Zap size={16} />
                <span className="hidden sm:inline">Execute</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              title="Download Policy"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {isResultsVisible ? (
          <ResizablePanel
            direction="vertical"
            initialSize={60}
            minSize={30}
            maxSize={90}
            className="h-full"
          >
            {EditorPanel}
            {ResultsPanel}
          </ResizablePanel>
        ) : (
          EditorPanel
        )}
      </div>
    </div>
  );
}