// frontend/src/components/EnhancedCodeEditor.tsx
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Code2, AlertCircle, Play, Shield, Bug, Download, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import IntelliSense from './IntelliSense';
import { intellisense, type Suggestion } from '../services/intellisense';

interface EnhancedCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  errors?: Array<{ line?: number; type: string; message: string }>;
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

interface Token {
  type: 'keyword' | 'identifier' | 'string' | 'number' | 'operator' | 'delimiter' | 'comment' | 'whitespace';
  value: string;
  line: number;
  column: number;
}

const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  code,
  onCodeChange,
  errors = [],
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [realtimeErrors, setRealtimeErrors] = useState<Array<{ line: number; type: string; message: string }>>([]);
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
    let result: React.ReactNode[] = [];
    let lineContent: React.ReactNode[] = [];
    
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

  // Combine backend errors with real-time validation errors
  const allErrors = useMemo(() => {
    const combined = [...errors];
    realtimeErrors.forEach(reError => {
      if (!combined.some(err => err.line === reError.line && err.message === reError.message)) {
        combined.push(reError);
      }
    });
    return combined;
  }, [errors, realtimeErrors]);

  // Group errors by line for display
  const errorsByLine = useMemo(() => {
    const grouped = new Map<number, Array<{ type: string; message: string }>>();
    allErrors.forEach(error => {
      const line = error.line ?? 1;
      if (!grouped.has(line)) {
        grouped.set(line, []);
      }
      grouped.get(line)!.push({ type: error.type, message: error.message });
    });
    return grouped;
  }, [allErrors]);

  // Local IntelliSense trigger
  const triggerIntelliSense = useCallback((cursorPosition: number) => {
    try {
      const newSuggestions = intellisense.getSuggestions(code, cursorPosition);
      
      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
        setSelectedSuggestionIndex(0);
        setShowSuggestions(true);
        updateSuggestionPosition();
      } else {
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('IntelliSense error:', error);
      setShowSuggestions(false);
    }
  }, [code]);

  // Real-time validation
  const performRealtimeValidation = useCallback((currentCode: string) => {
    try {
      const validationErrors = intellisense.validateRealtime(currentCode);
      setRealtimeErrors(validationErrors);
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, []);

  const updateSuggestionPosition = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const cursorCoords = getCursorCoordinates(textarea);
    
    setSuggestionPosition({
      top: rect.top + cursorCoords.top + 20,
      left: rect.left + cursorCoords.left
    });
  };

  const getCursorCoordinates = (element: HTMLTextAreaElement) => {
    const { selectionStart } = element;
    const textBeforeCursor = element.value.substring(0, selectionStart);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex] || '';
    
    const lineHeight = 24;
    const charWidth = 8.4;
    
    // Get the element's bounding rect and scroll position
    const scrollTop = element.scrollTop;
    const scrollLeft = element.scrollLeft;
    
    // Calculate position relative to visible area
    const relativeTop = currentLineIndex * lineHeight - scrollTop;
    const relativeLeft = currentLineText.length * charWidth - scrollLeft;
    
    return {
      top: relativeTop,
      left: relativeLeft
    };
  };

// In EnhancedCodeEditor component - update the handleInput method
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newCode = e.target.value;
  const cursorPosition = e.target.selectionStart;
  
  onCodeChange(newCode);
  
  // Perform real-time validation
  performRealtimeValidation(newCode);
  
  // Get the current character and context
  const lastChar = newCode[cursorPosition - 1];
  const textBeforeCursor = newCode.substring(0, cursorPosition);
  const currentLine = textBeforeCursor.split('\n').pop() || '';
  
  // Trigger IntelliSense on:
  // - Colon (property definition)
  // - Dot (object access)
  // - Space after colon (value suggestions)
  // - Any letter (completing values)
  // - Comma (multiple values)
  const triggerChars = [':', '.', ' ', ',', ...'abcdefghijklmnopqrstuvwxyz'];
  
  if (triggerChars.includes(lastChar) || /[a-zA-Z]/.test(lastChar)) {
    // Don't trigger if we're clearly in the middle of a word that's not after a property
    if (/[a-zA-Z]/.test(lastChar)) {
      const lineBeforeCursor = currentLine.substring(0, currentLine.length - 1);
      // Only trigger if we're after a colon or this looks like a value completion
      if (lineBeforeCursor.includes(':') || lineBeforeCursor.trim().endsWith(':')) {
        triggerIntelliSense(cursorPosition);
      } else {
        setShowSuggestions(false);
      }
    } else {
      triggerIntelliSense(cursorPosition);
    }
  } else {
    setShowSuggestions(false);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestionIndex]);
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }
    
    // Manual trigger with Ctrl+Space
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      triggerIntelliSense(e.currentTarget.selectionStart);
      return;
    }
    
    // Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert spaces for tab
      const spaces = ' '.repeat(tabSize);
      const newValue = code.substring(0, start) + spaces + code.substring(end);
      onCodeChange(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        textarea.focus();
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

  const applySuggestion = (suggestion: Suggestion) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    
    // Find the start of the current word
    let wordStart = cursorPosition;
    while (wordStart > 0 && /[\w.]/.test(code[wordStart - 1])) {
      wordStart--;
    }
    
    // Replace the partial word with the suggestion
    const before = code.substring(0, wordStart);
    const after = code.substring(cursorPosition);
    
    // Handle snippet placeholders
    let insertText = suggestion.insertText;
    insertText = insertText.replace(/\$\{[^}]+\}/g, '');
    
    const newCode = before + insertText + after;
    onCodeChange(newCode);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      const newCursorPos = wordStart + insertText.length;
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
      
      // Trigger validation after applying suggestion
      performRealtimeValidation(newCode);
    }, 0);
    
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Hide suggestions when editor loses focus
    setShowSuggestions(false);
  };

  const getLineClass = (lineNumber: number) => {
    const lineErrors = allErrors.filter(error => error.line === lineNumber);
    if (lineErrors.length > 0) {
      return lineErrors.some(error => error.type === 'ERROR') 
        ? isDark ? 'bg-red-900/20' : 'bg-red-50'
        : isDark ? 'bg-yellow-900/20' : 'bg-yellow-50';
    }
    return '';
  };

  const getLineIndicator = (lineNumber: number) => {
    const lineErrors = allErrors.filter(error => error.line === lineNumber);
    if (lineErrors.length > 0) {
      return lineErrors.some(error => error.type === 'ERROR') 
        ? 'border-l-2 border-red-500'
        : 'border-l-2 border-yellow-500';
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
  const errorCount = allErrors.filter(e => e.type === 'ERROR').length;
  const warningCount = allErrors.filter(e => e.type === 'WARNING' || e.type === 'RISK').length;

  return (
    <div className={`${isDark ? 'border-[#3F3F46] bg-[#242426]' : 'border-[#D1D5DB] bg-white'} border overflow-hidden flex flex-col h-full ${className}`}>
      {/* Editor Header */}
      <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} px-4 py-3 border-b flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <Code2 size={18} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
          <h3 className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
            AuthScript
          </h3>
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
            {allErrors.length === 0 && code.trim() && (
              <span className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-[#10B981]' : 'text-[#059669]'}`}>
                <CheckCircle size={14} />
                No issues
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onValidate && (
              <button
                onClick={onValidate}
                disabled={isValidating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                  ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              >
                Validate
              </button>
            )}

            {onCompile && (
              <button
                onClick={onCompile}
                disabled={isCompiling}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                  ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              >
                {isCompiling ? 'Compiling...' : 'Compile'}
              </button>
            )}

            {onSecurityAnalysis && (
              <button
                onClick={onSecurityAnalysis}
                disabled={isAnalyzingSecurity}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                  ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]'}`}
              >
                <Shield size={14} />
                {isAnalyzingSecurity ? 'Scanning...' : 'Scan'}
              </button>
            )}

            {onDebug && (
              <button
                onClick={onDebug}
                disabled={isDebugging}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                  ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
              >
                <Bug size={14} />
                {isDebugging ? 'Debugging...' : 'Debug'}
              </button>
            )}

            {hasCompiledPolicy && onExecute && (
              <button
                onClick={onExecute}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 
                  active:scale-95 bg-[#10B981] text-white hover:bg-[#059669]`}
              >
                <Play size={14} />
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
                <Download size={14} />
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
            const hasError = errorsByLine.has(lineNumber);
            const errorType = hasError && errorsByLine.get(lineNumber)!.some(e => e.type === 'ERROR') ? 'ERROR' : 'WARNING';
            
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
                {hasError && (
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
              padding: '4px 16px'
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
            onBlur={handleBlur}
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
            placeholder="Start typing SPL code... (Ctrl+Space for IntelliSense)"
          />
        </div>
      </div>

      {/* Error Panel */}
      {allErrors.length > 0 && (
        <div className={`shrink-0 border-t ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'} max-h-32 overflow-y-auto`}>
          {allErrors.map((error, index) => (
            <div
              key={index}
              className={`px-4 py-2.5 border-b last:border-b-0 flex items-start gap-3 ${
                error.type === 'ERROR' 
                  ? isDark ? 'border-l-4 border-red-500 hover:bg-red-900/10' : 'border-l-4 border-red-500 hover:bg-red-50'
                  : isDark ? 'border-l-4 border-yellow-500 hover:bg-yellow-900/10' : 'border-l-4 border-yellow-500 hover:bg-yellow-50'
              } transition-colors`}
            >
              <AlertCircle 
                size={16} 
                className={`mt-0.5 shrink-0 ${
                  error.type === 'ERROR' 
                    ? isDark ? 'text-red-500' : 'text-red-600'
                    : isDark ? 'text-yellow-500' : 'text-yellow-600'
                }`} 
              />
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

      {/* Status Bar */}
      <div className={`shrink-0 px-4 py-1.5 border-t text-xs flex justify-between items-center ${
        isDark ? 'bg-[#2D2E30] border-[#3F3F46] text-[#6B7280]' : 'bg-gray-50 border-gray-200 text-gray-500'
      }`}>
        <div className="flex items-center gap-4">
          <span>Lines: {lines.length}</span>
          <span>Chars: {code.length}</span>
          <span>Active: Line {activeLineNumber}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>SPL</span>
          <span>UTF-8</span>
          <span>Tab Size: {tabSize}</span>
        </div>
      </div>

      {/* IntelliSense Popup */}
      {showSuggestions && (
        <IntelliSense
          suggestions={suggestions}
          position={suggestionPosition}
          onSelect={applySuggestion}
          onDismiss={() => setShowSuggestions(false)}
          selectedIndex={selectedSuggestionIndex}
        />
      )}
    </div>
  );
};

export default EnhancedCodeEditor;