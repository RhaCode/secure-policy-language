// frontend/src/components/CodeEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Code2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { CodeEditorProps } from '../types';

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onCodeChange, 
  errors, 
  className = '',
  onValidate,
  onCompile,
  onSecurityAnalysis,
  onDebug,
  onDownload,
  onExecute,
  isCompiling = false,
  isAnalyzingSecurity = false,
  isDebugging = false,
  isValidating = false,
  hasCompiledPolicy = false
}) => {
  const { isDark } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [activeLineNumber, setActiveLineNumber] = useState(1);

  useEffect(() => {
    if (textareaRef.current) {
      const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
      };
      
      const textarea = textareaRef.current;
      textarea.addEventListener('scroll', handleScroll);
      
      return () => textarea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCodeChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onCodeChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleCursorChange = () => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = code.substring(0, cursorPosition);
      const lineNumber = textBeforeCursor.split('\n').length;
      setActiveLineNumber(lineNumber);
    }
  };

  const getLineClass = (lineNumber: number) => {
    const lineErrors = errors.filter(error => error.line === lineNumber);
    if (lineErrors.length > 0) {
      return lineErrors.some(error => error.type === 'ERROR') 
        ? isDark ? 'bg-red-900/20' : 'bg-red-50'
        : isDark ? 'bg-yellow-900/20' : 'bg-yellow-50';
    }
    return '';
  };

  const getLineIndicator = (lineNumber: number) => {
    const lineErrors = errors.filter(error => error.line === lineNumber);
    if (lineErrors.length > 0) {
      return lineErrors.some(error => error.type === 'ERROR') 
        ? 'border-l-2 border-red-500'
        : 'border-l-2 border-yellow-500';
    }
    return '';
  };

  const getLineErrorType = (lineNumber: number): string => {
    const lineErrors = errors.filter(error => error.line === lineNumber);
    if (lineErrors.length > 0) {
      return lineErrors.some(error => error.type === 'ERROR') ? 'ERROR' : 'WARNING';
    }
    return '';
  };

  const lines = code.split('\n');
  const errorCount = errors.filter(e => e.type === 'ERROR').length;
  const warningCount = errors.filter(e => e.type === 'WARNING' || e.type === 'RISK').length;

  return (
    <div className={`${isDark ? 'border-[#3F3F46] bg-[#242426]' : 'border-[#D1D5DB] bg-white'} border overflow-hidden flex flex-col h-full ${className}`}>
      {/* Editor Header */}
      <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} px-4 py-3 border-b flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <Code2 size={18} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
          <h3 className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>SPL Editor</h3>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Issue Status */}
          <div className="flex gap-4 text-sm mr-4">
            {errorCount > 0 && (
              <span className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-[#F87171]' : 'text-[#DC2626]'}`}>
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-[#FBBF24]' : 'text-[#D97706]'}`}>
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
            {errors.length === 0 && code.trim() && (
              <span className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-[#10B981]' : 'text-[#059669]'}`}>
                ✓ No issues
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onValidate}
              disabled={isValidating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
            >
              Validate
            </button>

            <button
              onClick={onCompile}
              disabled={isCompiling}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
            >
              {isCompiling ? 'Compiling...' : 'Compile'}
            </button>

            <button
              onClick={onSecurityAnalysis}
              disabled={isAnalyzingSecurity}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]'}`}
            >
              {isAnalyzingSecurity ? 'Scanning...' : 'Scan'}
            </button>

            <button
              onClick={onDebug}
              disabled={isDebugging}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
            >
              {isDebugging ? 'Debugging...' : 'Debug'}
            </button>

            {hasCompiledPolicy && (
              <button
                onClick={onExecute}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  active:scale-95 bg-[#10B981] text-white hover:bg-[#059669]`}
              >
                Execute
              </button>
            )}

            {onDownload && (
              <button
                onClick={onDownload}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  active:scale-95
                  ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              >
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden flex">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className={`overflow-y-auto ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F3F4F6] border-[#D1D5DB]'} border-r select-none shrink-0`}
          style={{ width: '60px' }}
        >
          {lines.map((_, i) => {
            const lineNumber = i + 1;
            const errorType = getLineErrorType(lineNumber);
            return (
              <div
                key={i}
                className={`px-3 py-1 text-right text-sm font-mono leading-6 relative ${
                  isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                } ${
                  lineNumber === activeLineNumber 
                    ? isDark ? 'bg-[#312E81] text-[#C7D2FE] font-semibold' : 'bg-[#E0E7FF] text-[#3730A3] font-semibold' 
                    : ''
                } ${getLineClass(lineNumber)} ${getLineIndicator(lineNumber)}`}
                style={{ height: '24px' }}
              >
                {lineNumber}
                {errorType && (
                  <div className={`absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full ${
                    errorType === 'ERROR' 
                      ? isDark ? 'bg-red-500' : 'bg-red-500'
                      : isDark ? 'bg-yellow-500' : 'bg-yellow-500'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Code Input */}
        <div className="flex-1 relative overflow-hidden">
          {/* Highlighted Lines Background */}
          <div className="absolute inset-0 pointer-events-none font-mono text-sm leading-6 overflow-hidden">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`px-4 py-1 ${getLineClass(i + 1)}`}
                style={{ height: '24px' }}
              />
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onSelect={handleCursorChange}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            className={`w-full h-full resize-none ${
              isDark ? 'bg-[#242426] text-[#F3F4F6]' : 'bg-white text-[#111827]'
            } relative z-10 font-mono text-sm leading-6 px-4 py-1 focus:outline-none overflow-auto`}
            style={{ 
              tabSize: 2,
            }}
            spellCheck="false"
            placeholder="Enter your SPL policy code here..."
          />
        </div>
      </div>

      {/* Error Panel */}
      {errors.length > 0 && (
        <div className={`shrink-0 border-t ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'} max-h-32 overflow-y-auto`}>
          {errors.map((error, index) => (
            <div
              key={index}
              className={`px-4 py-2.5 border-b last:border-b-0 flex items-start gap-3 ${
                error.type === 'ERROR' 
                  ? isDark ? 'border-l-4 border-red-500 hover:bg-red-900/10' : 'border-l-4 border-red-500 hover:bg-red-50'
                  : isDark ? 'border-l-4 border-yellow-500 hover:bg-yellow-900/10' : 'border-l-4 border-yellow-500 hover:bg-yellow-50'
              } transition-colors`}
            >
              <div className="flex-1 text-sm">
                <span className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                  {error.line ? `Line ${error.line}:` : 'Error:'}
                </span>{' '}
                <span className={isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}>{error.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;