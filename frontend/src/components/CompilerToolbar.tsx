// frontend/src/components/CompilerToolbar.tsx
import React from 'react';
import { 
  Play, 
  AlertTriangle, 
  Shield, 
  Bug, 
  Download, 
  Loader2 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CompilerToolbarProps {
  onValidate: () => void;
  onCompile: () => void;
  onSecurityAnalysis: () => void;
  onDebug: () => void;
  onDownload: () => void;
  onExecute: () => void;
  isCompiling: boolean;
  isAnalyzingSecurity: boolean;
  isDebugging: boolean;
  isValidating: boolean;
  hasCompiledPolicy: boolean;
}

const CompilerToolbar: React.FC<CompilerToolbarProps> = ({
  onValidate,
  onCompile,
  onSecurityAnalysis,
  onDebug,
  onDownload,
  onExecute,
  isCompiling,
  isAnalyzingSecurity,
  isDebugging,
  isValidating,
  hasCompiledPolicy
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} px-4 py-3 border-b flex flex-wrap gap-2`}>
      {/* Validate Button */}
      <button
        onClick={onValidate}
        disabled={isValidating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
          isDark
            ? 'bg-[#3F3F46] text-[#E5E7EB] hover:bg-[#52525B] disabled:opacity-50'
            : 'bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] disabled:opacity-50'
        }`}
      >
        {isValidating ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <AlertTriangle size={16} />
        )}
        Validate
      </button>

      {/* Compile Button */}
      <button
        onClick={onCompile}
        disabled={isCompiling}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
          isDark
            ? 'bg-[#3730A3] text-white hover:bg-[#312E81] disabled:opacity-50'
            : 'bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50'
        }`}
      >
        {isCompiling ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Play size={16} />
        )}
        Compile
      </button>

      {/* Security Analysis Button */}
      <button
        onClick={onSecurityAnalysis}
        disabled={isAnalyzingSecurity}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
          isDark
            ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-50'
            : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-50'
        }`}
      >
        {isAnalyzingSecurity ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Shield size={16} />
        )}
        Security Scan
      </button>

      {/* Debug Button */}
      <button
        onClick={onDebug}
        disabled={isDebugging}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
          isDark
            ? 'bg-[#3F3F46] text-[#E5E7EB] hover:bg-[#52525B] disabled:opacity-50'
            : 'bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] disabled:opacity-50'
        }`}
      >
        {isDebugging ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Bug size={16} />
        )}
        Debug
      </button>

      <div className="flex-1" />

      {/* Download Button */}
      <button
        onClick={onDownload}
        disabled={!hasCompiledPolicy}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
          isDark
            ? 'bg-[#3F3F46] text-[#E5E7EB] hover:bg-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed'
            : 'bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
        title={hasCompiledPolicy ? 'Download compiled policy' : 'Compile first to download'}
      >
        <Download size={16} />
        Download
      </button>

      {/* Execute Button */}
      <button
        onClick={onExecute}
        disabled={!hasCompiledPolicy}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
          isDark
            ? 'bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed'
            : 'bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
        title={hasCompiledPolicy ? 'Test policy in execution engine' : 'Compile first to execute'}
      >
        <Play size={16} />
        Execute
      </button>
    </div>
  );
};

export default CompilerToolbar;