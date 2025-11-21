import React, { useRef, useEffect, useState } from 'react';
import type { CodeEditorProps } from '../types';
import { AlertCircle, CheckCircle2, Code2 } from 'lucide-react';

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onCodeChange, 
  errors, 
  className = '' 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [activeLineNumber, setActiveLineNumber] = useState(1);

  useEffect(() => {
    if (textareaRef.current) {
      // Synchronize scroll between textarea and line numbers
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
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onCodeChange(newValue);
      
      // Move cursor after the inserted spaces
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
        ? 'bg-red-50' 
        : 'bg-yellow-50';
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

  const lines = code.split('\n');
  const errorCount = errors.filter(e => e.type === 'ERROR').length;
  const warningCount = errors.filter(e => e.type === 'WARNING' || e.type === 'RISK').length;

  return (
    <div className={`border border-gray-300 overflow-hidden shadow-sm bg-white ${className}`}>
      {/* Editor Header */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Code2 size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">SPL Editor</h3>
        </div>
        <div className="flex gap-4 text-sm">
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 font-medium">
              <AlertCircle size={16} />
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 text-yellow-600 font-medium">
              <AlertCircle size={16} />
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {errors.length === 0 && code.trim() && (
            <span className="flex items-center gap-1.5 text-green-600 font-medium">
              <CheckCircle2 size={16} />
              No issues
            </span>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex bg-gray-50">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="overflow-hidden bg-gray-100 border-r border-gray-300 select-none"
          style={{ width: '60px' }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              className={`px-3 py-1 text-right text-sm text-gray-500 font-mono leading-6 ${
                i + 1 === activeLineNumber ? 'bg-blue-100 text-blue-700 font-semibold' : ''
              } ${getLineClass(i + 1)} ${getLineIndicator(i + 1)}`}
              style={{ height: '24px' }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Input */}
        <div className="flex-1 relative">
          {/* Highlighted Lines Background */}
          <div className="absolute inset-0 pointer-events-none font-mono text-sm leading-6">
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
            className="w-full h-96 resize-none bg-transparent relative z-10 text-gray-900 font-mono text-sm leading-6 px-4 py-1 focus:outline-none"
            style={{ 
              tabSize: 2,
              minHeight: '700px'
            }}
            spellCheck="false"
            placeholder="Enter your SPL policy code here...

Example:
ROLE Admin {
  can: *
}

RESOURCE DB_Finance {
  path: '/data/*'
}

ALLOW action: read, write ON RESOURCE: DB_Finance
IF (time.hour >= 9 AND time.hour <= 17)"
          />
        </div>
      </div>

      {/* Error Panel */}
      {errors.length > 0 && (
        <div className="border-t border-gray-300 bg-white max-h-40 overflow-y-auto">
          {errors.map((error, index) => (
            <div
              key={index}
              className={`px-4 py-2.5 border-b last:border-b-0 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                error.type === 'ERROR' 
                  ? 'border-l-4 border-red-500' 
                  : 'border-l-4 border-yellow-500'
              }`}
            >
              <AlertCircle 
                size={16} 
                className={`mt-0.5 shrink-0 ${
                  error.type === 'ERROR' ? 'text-red-500' : 'text-yellow-500'
                }`} 
              />
              <div className="flex-1 text-sm">
                <span className="font-semibold text-gray-900">Line {error.line}:</span>{' '}
                <span className="text-gray-700">{error.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;