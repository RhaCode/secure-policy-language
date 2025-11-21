import React from 'react';
import type { ErrorDisplayProps } from '../types';
import { XCircle, AlertTriangle } from 'lucide-react';

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, className = '' }) => {
  if (errors.length === 0) {
    return null;
  }

  const errorCount = errors.filter(e => e.type === 'ERROR').length;
  const warningCount = errors.filter(e => e.type === 'WARNING').length;

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-red-50 border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <XCircle size={20} className="text-red-600" />
          <h3 className="font-semibold text-red-800">Issues Found</h3>
        </div>
        <div className="flex gap-4 text-sm">
          {errorCount > 0 && (
            <span className="text-red-600">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-yellow-600">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Error List */}
      <div className="divide-y">
        {errors.map((error, index) => (
          <div
            key={index}
            className={`p-4 flex items-start gap-3 ${
              error.type === 'ERROR' 
                ? 'bg-red-50 text-red-800' 
                : 'bg-yellow-50 text-yellow-800'
            }`}
          >
            {error.type === 'ERROR' ? (
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-600" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                Line {error.line}: {error.message}
              </div>
              <div className="text-sm opacity-75 mt-1">
                {error.type === 'ERROR' ? 'This must be fixed to compile' : 'This should be reviewed'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorDisplay;