import React, { useState, useCallback } from 'react';
import { Play, Shield, Download, Code2 } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import CompilerOutput from './components/CompilerOutput';
import RiskReport from './components/RiskReport';
import { apiService } from './services/api';
import type { 
  CompilationResponse, 
  SecurityAnalysisResponse 
} from './types';

// Sample SPL code for demonstration
const SAMPLE_CODE = `ROLE Admin {
  can: *
}

ROLE Developer {
  can: read, write
}

RESOURCE DB_Finance {
  path: "/data/financial"
}

ALLOW action: read, write ON RESOURCE: DB_Finance
IF (user.role == "Developer" AND time.hour >= 9 AND time.hour <= 17)

DENY action: delete ON RESOURCE: DB_Finance
IF (user.role == "Developer")

USER Alice {
  role: Admin
}

USER Bob {
  role: Developer
}`;

function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [compilationResult, setCompilationResult] = useState<CompilationResponse | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysisResponse | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  const [activeTab, setActiveTab] = useState<'compilation' | 'security'>('compilation');

  // Extract errors from compilation result
  const errors = React.useMemo(() => {
    if (!compilationResult) return [];
    
    const allErrors: Array<{ line: number; message: string; type: string }> = [];
    
    // Add parsing errors
    if (compilationResult.stages.parsing.errors) {
      compilationResult.stages.parsing.errors.forEach(error => {
        allErrors.push({ line: 1, message: error.message, type: 'ERROR' });
      });
    }
    
    // Add semantic analysis errors and warnings
    if (compilationResult.stages.semantic_analysis) {
      compilationResult.stages.semantic_analysis.errors?.forEach(error => {
        allErrors.push({ 
          line: error.line || 1, 
          message: error.message, 
          type: error.type 
        });
      });
      
      compilationResult.stages.semantic_analysis.warnings?.forEach(warning => {
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
          tokenization: { success: false },
          parsing: { success: false }
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar with Actions */}
      <header className="border-b border-slate-700 bg-card sticky top-0 z-50">
        <div className="max-w-full px-2 sm:px-4 lg:px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Left - Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Code2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SPL Compiler</h1>
                <p className="text-xs text-slate-400">Security Policy Language</p>
              </div>
            </div>

            {/* Center - File Info */}
            <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
              <div>Lines: <span className="text-white font-semibold">{code.split('\n').length}</span></div>
              <div>Characters: <span className="text-white font-semibold">{code.length}</span></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Ready</span>
            </div>

            {/* Right - Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCompile}
                disabled={isCompiling}
                className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group text-sm"
              >
                <Play size={16} className="group-hover:translate-x-0.5 transition-transform" />
                {isCompiling ? 'Compiling...' : 'Compile'}
              </button>

              <button
                onClick={handleSecurityAnalysis}
                disabled={isAnalyzingSecurity}
                className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group text-sm"
              >
                <Shield size={16} className="group-hover:translate-x-0.5 transition-transform" />
                {isAnalyzingSecurity ? 'Scanning...' : 'Scan'}
              </button>

              {compilationResult?.stages.code_generation && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200 group text-sm"
                >
                  <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                  Export
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-full h-full px-2 sm:px-2 lg:px-2 py-2">
          <div className="flex flex-col gap-2 h-full">
            {/* Top Panel - Code Editor (60%) */}
            <div className="h-3/5 flex flex-col min-w-0 max-h-[calc(100vh-300px)]">
              <div className="flex-1 overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
                {/* Code Editor Component */}
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    code={code}
                    onCodeChange={setCode}
                    errors={errors}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Panel - Results (40%) */}
            <div className="h-2/5 flex flex-col min-w-0">
              <div className="flex-1 overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
                {/* Tabs */}
                <div className="bg-linear-to-r from-slate-700 to-slate-800 border-b border-slate-700 flex shrink-0">
                  <button
                    onClick={() => setActiveTab('compilation')}
                    className={`flex-1 px-4 py-2 text-sm font-semibold transition-all ${
                      activeTab === 'compilation'
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-700/50'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Compilation
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                      activeTab === 'security'
                        ? 'text-green-400 border-b-2 border-green-400 bg-slate-700/50'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Security
                  </button>
                </div>

                {/* Results Content */}
                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'compilation' ? (
                    <CompilerOutput
                      compilationResult={compilationResult}
                      isLoading={isCompiling}
                      className="h-full"
                    />
                  ) : (
                    <RiskReport
                      securityAnalysis={securityAnalysis}
                      className="h-full"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;