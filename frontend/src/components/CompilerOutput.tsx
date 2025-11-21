import React, { useState } from 'react';
import type { CompilerOutputProps } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight,
  Code2,
  FileText,
  Shield
} from 'lucide-react';

const CompilerOutput: React.FC<CompilerOutputProps> = ({ 
  compilationResult, 
  isLoading,
  className = '' 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['tokenization', 'parsing', 'semantic_analysis', 'code_generation'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Compiling SPL code...</p>
        </div>
      </div>
    );
  }

  if (!compilationResult) {
    return (
      <div className={`border rounded-lg p-6 text-center text-gray-500 ${className}`}>
        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
        <p>Compilation results will appear here</p>
      </div>
    );
  }

  if (!compilationResult.success) {
    return (
      <div className={`border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="p-4 border-b border-red-200 flex items-center gap-2">
          <XCircle size={20} className="text-red-600" />
          <h3 className="font-semibold text-red-800">Compilation Failed</h3>
        </div>
        <div className="p-4">
          <p className="text-red-700">{compilationResult.error}</p>
        </div>
      </div>
    );
  }

  const { stages } = compilationResult;

  const SectionHeader: React.FC<{ 
    title: string; 
    success: boolean; 
    section: string;
    icon: React.ReactNode;
  }> = ({ title, success, section, icon }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold">{title}</span>
        {success ? (
          <CheckCircle2 size={16} className="text-green-600" />
        ) : (
          <XCircle size={16} className="text-red-600" />
        )}
      </div>
      {expandedSections.has(section) ? (
        <ChevronDown size={16} />
      ) : (
        <ChevronRight size={16} />
      )}
    </button>
  );

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-green-50 border-b p-4 flex items-center gap-2">
        <CheckCircle2 size={20} className="text-green-600" />
        <h3 className="font-semibold text-green-800">Compilation Successful</h3>
      </div>

      {/* Tokenization Section */}
      <div className="border-b">
        <SectionHeader
          title="Tokenization"
          success={stages.tokenization.success}
          section="tokenization"
          icon={<Code2 size={16} className="text-blue-600" />}
        />
        {expandedSections.has('tokenization') && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">
                {stages.tokenization.token_count} tokens generated
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {stages.tokenization.tokens?.slice(0, 20).map((token, index) => (
                <div key={index} className="flex gap-4 py-1 text-sm">
                  <span className="w-20 text-gray-500">{token.type}</span>
                  <span className="flex-1 font-mono">"{token.value}"</span>
                  <span className="w-8 text-right text-gray-400">L{token.line}</span>
                </div>
              ))}
              {stages.tokenization.tokens && stages.tokenization.tokens.length > 20 && (
                <div className="text-center text-gray-500 text-sm py-2">
                  ... and {stages.tokenization.tokens.length - 20} more tokens
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Parsing Section */}
      <div className="border-b">
        <SectionHeader
          title="Parsing"
          success={stages.parsing.success}
          section="parsing"
          icon={<FileText size={16} className="text-purple-600" />}
        />
        {expandedSections.has('parsing') && (
          <div className="p-4 bg-gray-50">
            <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
              {stages.parsing.ast}
            </pre>
          </div>
        )}
      </div>

      {/* Semantic Analysis Section */}
      {stages.semantic_analysis && (
        <div className="border-b">
          <SectionHeader
            title="Semantic Analysis"
            success={stages.semantic_analysis.success}
            section="semantic_analysis"
            icon={<Shield size={16} className="text-orange-600" />}
          />
          {expandedSections.has('semantic_analysis') && (
            <div className="p-4 bg-gray-50 space-y-4">
              {/* Statistics */}
              {stages.semantic_analysis.statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="font-semibold text-blue-600">
                      {stages.semantic_analysis.statistics.roles_defined}
                    </div>
                    <div className="text-gray-600">Roles</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="font-semibold text-green-600">
                      {stages.semantic_analysis.statistics.policies_defined}
                    </div>
                    <div className="text-gray-600">Policies</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="font-semibold text-red-600">
                      {stages.semantic_analysis.statistics.conflicts_found}
                    </div>
                    <div className="text-gray-600">Conflicts</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="font-semibold text-purple-600">
                      {stages.semantic_analysis.statistics.resources_defined}
                    </div>
                    <div className="text-gray-600">Resources</div>
                  </div>
                </div>
              )}

              {/* Conflicts */}
              {stages.semantic_analysis.conflicts && stages.semantic_analysis.conflicts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Policy Conflicts</h4>
                  {stages.semantic_analysis.conflicts.map((conflict, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-red-800">{conflict.type}</span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                          Risk: {conflict.risk_score}/100
                        </span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{conflict.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {stages.semantic_analysis.warnings && stages.semantic_analysis.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-2">Warnings</h4>
                  {stages.semantic_analysis.warnings.map((warning, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          Line {warning.line}: {warning.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Code Generation Section */}
      {stages.code_generation && (
        <div>
          <SectionHeader
            title="Code Generation"
            success={stages.code_generation.success}
            section="code_generation"
            icon={<Code2 size={16} className="text-green-600" />}
          />
          {expandedSections.has('code_generation') && (
            <div className="p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">
                  Target format: {stages.code_generation.target_format}
                </span>
              </div>
              <pre className="text-sm bg-white p-3 rounded border overflow-x-auto max-h-64">
                {stages.code_generation.generated_code}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompilerOutput;