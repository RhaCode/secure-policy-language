import React, { useState, useCallback } from 'react';
import { Play, Shield, Download } from 'lucide-react';
import Navbar from './components/Navbar';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Code Editor */}
          <div className="space-y-6">
            {/* Editor Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">SPL Editor</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCompile}
                  disabled={isCompiling}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={18} />
                  {isCompiling ? 'Compiling...' : 'Compile'}
                </button>
                
                <button
                  onClick={handleSecurityAnalysis}
                  disabled={isAnalyzingSecurity}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Shield size={18} />
                  {isAnalyzingSecurity ? 'Analyzing...' : 'Security Scan'}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <CodeEditor
              code={code}
              onCodeChange={setCode}
              errors={errors}
            />

            {/* Quick Actions */}
            <div className="flex gap-2">
              {compilationResult?.stages.code_generation && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download size={18} />
                  Download Policy
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('compilation')}
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === 'compilation'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Compilation Results
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === 'security'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Security Analysis
              </button>
            </div>

            {activeTab === 'compilation' ? (
              <CompilerOutput
                compilationResult={compilationResult}
                isLoading={isCompiling}
              />
            ) : (
              <RiskReport
                securityAnalysis={securityAnalysis}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;