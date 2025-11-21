import React, { useRef, useEffect } from 'react';
import type { CodeEditorProps } from '../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onCodeChange, 
  errors, 
  className = '' 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (textareaRef.current && preRef.current) {
      textareaRef.current.style.height = '500px';
      preRef.current.style.height = '500px';
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCodeChange(e.target.value);
    
    // Auto-resize
    if (textareaRef.current && preRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      preRef.current.style.height = textareaRef.current.style.height;
    }
  };

  const getLineClass = (lineNumber: number) => {
    const lineErrors = errors.filter(error => error.line === lineNumber);
    if (lineErrors.length > 0) {
      return lineErrors.some(error => error.type === 'ERROR') 
        ? 'bg-red-100 border-l-4 border-red-500' 
        : 'bg-yellow-100 border-l-4 border-yellow-500';
    }
    return '';
  };

  const lines = code.split('\n');
  const errorCount = errors.filter(e => e.type === 'ERROR').length;
  const warningCount = errors.filter(e => e.type === 'WARNING' || e.type === 'RISK').length;

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Editor Header */}
      <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">SPL Code Editor</h3>
        <div className="flex gap-4 text-sm">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle size={16} />
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertCircle size={16} />
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {errors.length === 0 && code.trim() && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={16} />
              No issues
            </span>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative font-mono text-sm">
        {/* Line numbers and syntax highlighting background */}
        <pre
          ref={preRef}
          className="absolute top-0 left-0 w-full h-64 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={`px-2 py-1 ${getLineClass(i + 1)}`}
            >
              <span className="inline-block w-8 text-right text-gray-400 mr-4 select-none">
                {i + 1}
              </span>
              <span className="text-gray-800">{line}</span>
            </div>
          ))}
        </pre>

        {/* Textarea for input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleInput}
          className="w-full h-64 resize-none bg-transparent relative z-10 caret-black text-transparent whitespace-pre overflow-hidden outline-none px-2 py-1"
          style={{ 
            lineHeight: '1.5rem',
            fontFamily: 'monospace',
            tabSize: 2
          }}
          spellCheck="false"
          placeholder="Enter your SPL policy code here...
          
Example:
ROLE Admin {
  can: *
}

RESOURCE DB_Finance {
  path: '/finance/*'
}

ALLOW action: read, write ON RESOURCE: DB_Finance
IF (time.hour >= 9 AND time.hour <= 17)"
        />
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="border-t">
          {errors.map((error, index) => (
            <div
              key={index}
              className={`p-3 border-b last:border-b-0 ${
                error.type === 'ERROR' 
                  ? 'bg-red-50 text-red-800' 
                  : 'bg-yellow-50 text-yellow-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle 
                  size={16} 
                  className={`mt-0.5 shrink-0 ${
                    error.type === 'ERROR' ? 'text-red-500' : 'text-yellow-500'
                  }`} 
                />
                <div>
                  <span className="font-medium">Line {error.line}:</span> {error.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;