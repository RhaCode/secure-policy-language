// frontend/src/App.tsx
import { useState, useCallback, useMemo } from 'react';
import { Play, Shield, Download, Code2, Moon, Sun } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { apiService } from './services/api';
import CodeEditor from './components/CodeEditor';
import CompilerOutput from './components/CompilerOutput';
import RiskReport from './components/RiskReport';
import type { CompilationResponse, SecurityAnalysisResponse, CompilationError } from './types';

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
  const { isDark, toggleTheme } = useTheme();
  const [code, setCode] = useState(SAMPLE_CODE);
  const [compilationResult, setCompilationResult] = useState<CompilationResponse | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysisResponse | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  const [activeTab, setActiveTab] = useState<'compilation' | 'security'>('compilation');

  const errors = useMemo(() => {
    if (!compilationResult) return [];
    
    const allErrors: CompilationError[] = [];
    
    if (compilationResult.stages?.parsing?.errors) {
      compilationResult.stages.parsing.errors.forEach((error) => {
        allErrors.push({ line: 1, message: error.message, type: 'ERROR' });
      });
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
        stages: { tokenization: { success: false }, parsing: { success: false } }
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
    <div className={`h-screen flex flex-col transition-colors ${
      isDark 
        ? 'bg-[#1C1C1E]' 
        : 'bg-[#F3F4F6]'
    }`}>
      {/* Navbar */}
      <header className={`border-b ${isDark ? 'bg-[#242426] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'} sticky top-0 z-50 shrink-0`}>
        <div className="px-2 sm:px-4 lg:px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Left - Branding */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isDark ? 'bg-[#3F3F46]' : 'bg-[#E5E7EB]'} flex items-center justify-center rounded-lg`}>
                <Code2 size={24} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>SPL Compiler</h1>
                <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>Security Policy Language</p>
              </div>
            </div>

            {/* Center - File Info */}
            <div className={`hidden md:flex items-center gap-6 text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
              <div>Lines: <span className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>{code.split('\n').length}</span></div>
              <div>Characters: <span className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>{code.length}</span></div>
              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#10B981]' : 'bg-[#059669]'}`}></div>
              <span>Ready</span>
            </div>

            {/* Right - Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCompile}
                disabled={isCompiling}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-95 shadow-md hover:shadow-lg
                  ${isDark 
                    ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' 
                    : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'
                  }`}
              >
                <Play size={16} />
                <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
              </button>

              <button
                onClick={handleSecurityAnalysis}
                disabled={isAnalyzingSecurity}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-95 shadow-md hover:shadow-lg
                  ${isDark 
                    ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' 
                    : 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]'
                  }`}
              >
                <Shield size={16} />
                <span>{isAnalyzingSecurity ? 'Scanning...' : 'Scan'}</span>
              </button>

              {compilationResult?.stages?.code_generation && (
                <button
                  onClick={handleDownload}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 
                    active:scale-95 shadow-md hover:shadow-lg text-sm
                    ${isDark 
                      ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' 
                      : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'
                    }`}
                >
                  <Download size={16} />
                  Export
                </button>
              )}

              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg
                  ${isDark
                    ? 'bg-[#3F3F46] text-[#FBBF24] hover:bg-[#52525B]'
                    : 'bg-[#E5E7EB] text-[#D97706] hover:bg-[#D1D5DB]'
                  }`}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          <div className="flex flex-col h-full">
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
                      ? isDark
                        ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30'
                        : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
                      : isDark
                      ? 'text-[#6B7280] hover:text-[#A1A1AA]'
                      : 'text-[#9CA3AF] hover:text-[#6B7280]'
                  }`}
                >
                  Compilation
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === 'security'
                      ? isDark
                        ? 'text-[#C7D2FE] border-b-2 border-[#C7D2FE] bg-[#312E81]/30'
                        : 'text-[#3730A3] border-b-2 border-[#3730A3] bg-[#E0E7FF]/30'
                      : isDark
                      ? 'text-[#6B7280] hover:text-[#A1A1AA]'
                      : 'text-[#9CA3AF] hover:text-[#6B7280]'
                  }`}
                >
                  Security
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
      </main>
    </div>
  );
}

export default App;