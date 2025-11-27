// frontend/src/components/CodeEditor.tsx
import React, { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { Code2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { CodeEditorProps } from '../types';

interface Token {
  type: 'keyword' | 'identifier' | 'string' | 'number' | 'operator' | 'delimiter' | 'comment' | 'whitespace';
  value: string;
  line: number;
  column: number;
}

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
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [activeLineNumber, setActiveLineNumber] = useState(1);
  const [tabSize] = useState(2);

  // SPL Language tokens
  const SPL_KEYWORDS = new Set([
    'ROLE', 'USER', 'RESOURCE', 'ALLOW', 'DENY',
    'ON', 'IF', 'AND', 'OR', 'NOT',
    'ACTION', 'CAN', 'TRUE', 'FALSE'
  ]);

  const SPL_OPERATORS = new Set([
    '==', '!=', '<=', '>=', '<', '>', '='
  ]);

  const SPL_DELIMITERS = new Set([
    '{', '}', '(', ')', ',', ':', '.', '*'
  ]);

  // Tokenize code for syntax highlighting
  const tokens = useMemo(() => {
    const tokenList: Token[] = [];
    let line = 1;
    let column = 1;
    let i = 0;

    while (i < code.length) {
      const char = code[i];
      const remaining = code.substring(i);

      // Handle newlines
      if (char === '\n') {
        tokenList.push({ type: 'whitespace', value: '\n', line, column });
        line++;
        column = 1;
        i++;
        continue;
      }

      // Handle whitespace
      if (/\s/.test(char)) {
        const match = remaining.match(/^(\s+)/);
        if (match) {
          tokenList.push({ type: 'whitespace', value: match[1], line, column });
          column += match[1].length;
          i += match[1].length;
          continue;
        }
      }

      // Handle comments (single-line //)
      if (remaining.startsWith('//')) {
        const match = remaining.match(/^(\/\/.*?)(?=\n|$)/);
        if (match) {
          tokenList.push({ type: 'comment', value: match[1], line, column });
          column += match[1].length;
          i += match[1].length;
          continue;
        }
      }

      // Handle comments (multi-line /* */)
      if (remaining.startsWith('/*')) {
        const endIndex = remaining.indexOf('*/');
        if (endIndex !== -1) {
          const comment = remaining.substring(0, endIndex + 2);
          const newlines = comment.split('\n').length - 1;
          tokenList.push({ type: 'comment', value: comment, line, column });
          i += comment.length;
          column = comment.split('\n').length > 1 
            ? comment.split('\n').pop()!.length + 1 
            : column + comment.length;
          line += newlines;
          continue;
        }
      }

      // Handle strings (double quotes)
      if (char === '"') {
        const match = remaining.match(/^"([^"\\]|\\.)*"/);
        if (match) {
          tokenList.push({ type: 'string', value: match[0], line, column });
          column += match[0].length;
          i += match[0].length;
          continue;
        }
      }

      // Handle strings (single quotes)
      if (char === "'") {
        const match = remaining.match(/^'([^'\\]|\\.)*'/);
        if (match) {
          tokenList.push({ type: 'string', value: match[0], line, column });
          column += match[0].length;
          i += match[0].length;
          continue;
        }
      }

      // Handle numbers
      if (/\d/.test(char)) {
        const match = remaining.match(/^\d+(\.\d+)?/);
        if (match) {
          tokenList.push({ type: 'number', value: match[0], line, column });
          column += match[0].length;
          i += match[0].length;
          continue;
        }
      }

      // Handle two-character operators
      if (i + 1 < code.length) {
        const twoChar = code.substring(i, i + 2);
        if (SPL_OPERATORS.has(twoChar)) {
          tokenList.push({ type: 'operator', value: twoChar, line, column });
          column += 2;
          i += 2;
          continue;
        }
      }

      // Handle delimiters
      if (SPL_DELIMITERS.has(char)) {
        tokenList.push({ type: 'delimiter', value: char, line, column });
        column++;
        i++;
        continue;
      }

      // Handle identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        const match = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
        if (match) {
          const value = match[0];
          const type = SPL_KEYWORDS.has(value) ? 'keyword' : 'identifier';
          tokenList.push({ type, value, line, column });
          column += value.length;
          i += value.length;
          continue;
        }
      }

      // Single character operators
      if (SPL_OPERATORS.has(char)) {
        tokenList.push({ type: 'operator', value: char, line, column });
        column++;
        i++;
        continue;
      }

      // Unknown character, skip
      i++;
      column++;
    }

    return tokenList;
  }, [code]);

  // Render highlighted code preserving exact spacing
  const renderHighlightedCode = () => {
    let currentLine = 1;
    let result: ReactNode[] = [];
    let lineContent: ReactNode[] = [];
    
    tokens.forEach((token, idx) => {
      if (token.line > currentLine) {
        // Finish current line
        result.push(
          <div key={`line-${currentLine}`} style={{ height: '24px' }}>
            {lineContent}
          </div>
        );
        // Add any missing empty lines
        for (let i = currentLine + 1; i < token.line; i++) {
          result.push(<div key={`line-${i}`} style={{ height: '24px' }}>{'\n'}</div>);
        }
        currentLine = token.line;
        lineContent = [];
      }
      
      if (token.type === 'whitespace' && token.value === '\n') {
        // Don't add newline to content, it's handled by line break
      } else {
        lineContent.push(
          <span
            key={`${currentLine}-${idx}`}
            className={`${getTokenColor(token.type)} ${token.type === 'comment' ? 'italic' : ''}`}
          >
            {token.value}
          </span>
        );
      }
    });
    
    // Add final line
    if (lineContent.length > 0 || currentLine <= lines.length) {
      result.push(
        <div key={`line-${currentLine}`} style={{ height: '24px' }}>
          {lineContent}
        </div>
      );
    }
    
    // Add any remaining empty lines
    for (let i = currentLine + 1; i <= lines.length; i++) {
      result.push(<div key={`line-${i}`} style={{ height: '24px' }}>{'\n'}</div>);
    }
    
    return result;
  };

  // Sync scroll between textarea, highlight, and line numbers
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      if (highlightRef.current && textareaRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
      if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
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
      const spaces = ' '.repeat(tabSize);
      const newValue = code.substring(0, start) + spaces + code.substring(end);
      onCodeChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
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

  const getTokenColor = (tokenType: string): string => {
    if (isDark) {
      switch (tokenType) {
        case 'keyword': return 'text-[#569CD6]'; // Blue
        case 'identifier': return 'text-[#D4D4D4]'; // Light gray
        case 'string': return 'text-[#CE9178]'; // Orange
        case 'number': return 'text-[#B5CEA8]'; // Green
        case 'operator': return 'text-[#D4D4D4]'; // Light gray
        case 'delimiter': return 'text-[#D4D4D4]'; // Light gray
        case 'comment': return 'text-[#6A9955]'; // Green
        default: return 'text-[#D4D4D4]';
      }
    } else {
      switch (tokenType) {
        case 'keyword': return 'text-[#0000FF]'; // Blue
        case 'identifier': return 'text-[#000000]'; // Black
        case 'string': return 'text-[#A31515]'; // Red
        case 'number': return 'text-[#098658]'; // Green
        case 'operator': return 'text-[#000000]'; // Black
        case 'delimiter': return 'text-[#000000]'; // Black
        case 'comment': return 'text-[#008000]'; // Green
        default: return 'text-[#000000]';
      }
    }
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
      <div className="flex-1 overflow-hidden flex relative">
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
          {/* Syntax Highlight Layer */}
          <div
            ref={highlightRef}
            className={`absolute inset-0 pointer-events-none font-mono text-sm leading-6 overflow-auto ${
              isDark ? 'bg-[#242426]' : 'bg-white'
            }`}
            style={{ 
              tabSize: 2,
              whiteSpace: 'pre',
              wordWrap: 'off' as any,
              overflowWrap: 'normal',
              padding: '4px 16px' // Match textarea padding: py-1 px-4
            }}
          >
            {renderHighlightedCode()}
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
            className={`absolute inset-0 w-full h-full resize-none ${
              isDark ? 'bg-transparent text-[#F3F4F6]' : 'bg-transparent text-[#111827]'
            } font-mono text-sm leading-6 px-4 py-1 focus:outline-none overflow-auto relative z-10`}
            style={{ 
              tabSize: tabSize,
              whiteSpace: 'pre',
              wordWrap: 'off' as any,
              overflowWrap: 'normal',
              color: 'transparent',
              caretColor: isDark ? '#F3F4F6' : '#111827',
              resize: 'none'
            }}
            spellCheck="false"
            placeholder=""
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