// frontend/src/components/CompilerOutput.tsx
import React, { useState } from "react";
import { Code2, Shield } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import type { CompilationError, CompilerOutputProps } from "../types";

const CompilerOutput: React.FC<CompilerOutputProps> = ({
  compilationResult,
  isLoading,
  className = "",
}) => {
  const { isDark } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["tokenization", "parsing", "semantic_analysis", "code_generation"])
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
      <div
        className={`${
          isDark ? "border-[#3F3F46] bg-[#242426]" : "border-[#D1D5DB] bg-white"
        } border overflow-hidden flex flex-col h-full ${className}`}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div
              className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                isDark ? "border-[#60A5FA]" : "border-[#2563EB]"
              } mx-auto`}
            ></div>
            <p
              className={`mt-2 ${isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"}`}
            >
              Compiling SPL code...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!compilationResult) {
    return (
      <div
        className={`${
          isDark ? "border-[#3F3F46] bg-[#242426]" : "border-[#D1D5DB] bg-white"
        } border overflow-hidden flex flex-col h-full ${className}`}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Code2
              size={48}
              className={`mx-auto mb-4 ${
                isDark ? "text-[#3F3F46]" : "text-[#D1D5DB]"
              }`}
            />
            <p className={isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"}>
              Compilation results will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!compilationResult.success) {
    const isBlocked = compilationResult.stage === "semantic_analysis";

    return (
      <div
        className={`${
          isDark ? "border-red-800 bg-red-900/20" : "border-red-200 bg-red-50"
        } border overflow-hidden flex flex-col h-full ${className}`}
      >
        <div
          className={`shrink-0 p-4 border-b ${
            isDark ? "border-red-800" : "border-red-200"
          } flex items-center gap-2`}
        >
          <div className={isDark ? "text-[#F87171]" : "text-[#DC2626]"}>
            {isBlocked ? "⛔" : "✕"}
          </div>
          <h3
            className={`font-semibold ${
              isDark ? "text-[#F87171]" : "text-[#DC2626]"
            }`}
          >
            {isBlocked ? "Compilation Blocked" : "Compilation Failed"}
          </h3>
        </div>

        <div className="flex-1 p-4 overflow-auto space-y-3">
          {isBlocked && (
            <div
              className={`p-3 rounded-lg border ${
                isDark
                  ? "bg-orange-900/30 border-orange-800 text-orange-300"
                  : "bg-orange-50 border-orange-200 text-orange-800"
              }`}
            >
              <p className="font-semibold mb-2">⚠️ Semantic Analysis Failed</p>
              <p className="text-sm">
                Compilation was blocked due to semantic errors. These errors
                must be fixed before the policy can be compiled and deployed.
              </p>
            </div>
          )}

          {/* Show compilation message if available */}
          {compilationResult.message && (
            <div
              className={`p-3 rounded border text-sm ${
                isDark
                  ? "bg-[#242426] border-[#3F3F46] text-[#F3F4F6]"
                  : "bg-white border-[#D1D5DB] text-[#111827]"
              }`}
            >
              {compilationResult.message}
            </div>
          )}

          {/* Show errors */}
          {compilationResult.errors &&
            Array.isArray(compilationResult.errors) && (
              <div className="space-y-2">
                <h4
                  className={`font-semibold text-sm ${
                    isDark ? "text-[#F87171]" : "text-[#DC2626]"
                  }`}
                >
                  Errors ({compilationResult.errors.length})
                </h4>
                {compilationResult.errors.map(
                  (error: CompilationError, index: number) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-3 rounded border text-sm ${
                        isDark
                          ? "bg-red-900/20 border-red-800 text-red-300"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      <span className="shrink-0 font-semibold">
                        {error.line ? `Line ${error.line}:` : "•"}
                      </span>
                      <span>{error.message}</span>
                    </div>
                  )
                )}
              </div>
            )}

          {/* Show generic error if available */}
          {compilationResult.error && (
            <p
              className={`text-sm ${
                isDark ? "text-[#F87171]" : "text-[#DC2626]"
              }`}
            >
              {compilationResult.error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { stages } = compilationResult;

  return (
    <div
      className={`${
        isDark ? "border-[#3F3F46] bg-[#242426]" : "border-[#D1D5DB] bg-white"
      } border overflow-hidden flex flex-col h-full ${className}`}
    >
      {/* Header */}
      <div
        className={`shrink-0 ${
          isDark
            ? "bg-[#312E81] border-[#3F3F46]"
            : "bg-[#E0E7FF] border-[#D1D5DB]"
        } border-b p-4 flex items-center gap-2`}
      >
        <div className={isDark ? "text-[#C7D2FE]" : "text-[#3730A3]"}>✓</div>
        <h3
          className={`font-semibold ${
            isDark ? "text-[#C7D2FE]" : "text-[#3730A3]"
          }`}
        >
          Compilation Successful
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tokenization Section */}
        <div
          className={`border-b ${
            isDark ? "border-[#3F3F46]" : "border-[#D1D5DB]"
          }`}
        >
          <button
            onClick={() => toggleSection("tokenization")}
            className={`w-full p-4 text-left flex items-center justify-between ${
              isDark ? "hover:bg-[#2D2E30]" : "hover:bg-[#F9FAFB]"
            } transition-colors`}
          >
            <div className="flex items-center gap-3">
              <Code2
                size={16}
                className={isDark ? "text-[#60A5FA]" : "text-[#2563EB]"}
              />
              <span
                className={`font-semibold ${
                  isDark ? "text-[#F3F4F6]" : "text-[#111827]"
                }`}
              >
                Tokenization
              </span>
              <div className={isDark ? "text-[#10B981]" : "text-[#059669]"}>
                ✓
              </div>
            </div>
            {expandedSections.has("tokenization") ? "▼" : "▶"}
          </button>
          {expandedSections.has("tokenization") && (
            <div className={`p-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"}`}>
              <div
                className={`flex justify-between items-center mb-3 text-sm ${
                  isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                }`}
              >
                <span>{stages.tokenization.token_count} tokens generated</span>
              </div>
            </div>
          )}
        </div>

        {/* Parsing Section */}
        <div
          className={`border-b ${
            isDark ? "border-[#3F3F46]" : "border-[#D1D5DB]"
          }`}
        >
          <button
            onClick={() => toggleSection("parsing")}
            className={`w-full p-4 text-left flex items-center justify-between ${
              isDark ? "hover:bg-[#2D2E30]" : "hover:bg-[#F9FAFB]"
            } transition-colors`}
          >
            <div className="flex items-center gap-3">
              <Code2
                size={16}
                className={isDark ? "text-[#8B5CF6]" : "text-[#7C3AED]"}
              />
              <span
                className={`font-semibold ${
                  isDark ? "text-[#F3F4F6]" : "text-[#111827]"
                }`}
              >
                Parsing
              </span>
              <div className={isDark ? "text-[#10B981]" : "text-[#059669]"}>
                ✓
              </div>
            </div>
            {expandedSections.has("parsing") ? "▼" : "▶"}
          </button>
          {expandedSections.has("parsing") && (
            <div className={`p-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"}`}>
              <pre
                className={`text-sm ${
                  isDark
                    ? "bg-[#242426] text-[#F3F4F6] border-[#3F3F46]"
                    : "bg-white text-[#111827] border-[#D1D5DB]"
                } p-3 rounded border overflow-x-auto max-h-40`}
              >
                {stages.parsing.ast}
              </pre>
            </div>
          )}
        </div>

        {/* Semantic Analysis Section */}
        {stages.semantic_analysis && (
          <div
            className={`border-b ${
              isDark ? "border-[#3F3F46]" : "border-[#D1D5DB]"
            }`}
          >
            <button
              onClick={() => toggleSection("semantic_analysis")}
              className={`w-full p-4 text-left flex items-center justify-between ${
                isDark ? "hover:bg-[#2D2E30]" : "hover:bg-[#F9FAFB]"
              } transition-colors`}
            >
              <div className="flex items-center gap-3">
                <Shield
                  size={16}
                  className={isDark ? "text-[#F97316]" : "text-[#D97706]"}
                />
                <span
                  className={`font-semibold ${
                    isDark ? "text-[#F3F4F6]" : "text-[#111827]"
                  }`}
                >
                  Semantic Analysis
                </span>
                <div className={isDark ? "text-[#10B981]" : "text-[#059669]"}>
                  ✓
                </div>
              </div>
              {expandedSections.has("semantic_analysis") ? "▼" : "▶"}
            </button>
            {expandedSections.has("semantic_analysis") && (
              <div
                className={`p-4 ${
                  isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"
                } space-y-4`}
              >
                {stages.semantic_analysis.statistics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div
                      className={`text-center p-3 ${
                        isDark
                          ? "bg-[#242426] border-[#3F3F46]"
                          : "bg-white border-[#D1D5DB]"
                      } rounded border`}
                    >
                      <div
                        className={`font-semibold ${
                          isDark ? "text-[#60A5FA]" : "text-[#2563EB]"
                        }`}
                      >
                        {stages.semantic_analysis.statistics.roles_defined || 0}
                      </div>
                      <div
                        className={isDark ? "text-[#6B7280]" : "text-[#6B7280]"}
                      >
                        Roles
                      </div>
                    </div>
                    <div
                      className={`text-center p-3 ${
                        isDark
                          ? "bg-[#242426] border-[#3F3F46]"
                          : "bg-white border-[#D1D5DB]"
                      } rounded border`}
                    >
                      <div
                        className={`font-semibold ${
                          isDark ? "text-[#10B981]" : "text-[#059669]"
                        }`}
                      >
                        {stages.semantic_analysis.statistics.policies_defined ||
                          0}
                      </div>
                      <div
                        className={isDark ? "text-[#6B7280]" : "text-[#6B7280]"}
                      >
                        Policies
                      </div>
                    </div>
                    <div
                      className={`text-center p-3 ${
                        isDark
                          ? "bg-[#242426] border-[#3F3F46]"
                          : "bg-white border-[#D1D5DB]"
                      } rounded border`}
                    >
                      <div
                        className={`font-semibold ${
                          isDark ? "text-[#F87171]" : "text-[#DC2626]"
                        }`}
                      >
                        {stages.semantic_analysis.statistics.conflicts_found ||
                          0}
                      </div>
                      <div
                        className={isDark ? "text-[#6B7280]" : "text-[#6B7280]"}
                      >
                        Conflicts
                      </div>
                    </div>
                    <div
                      className={`text-center p-3 ${
                        isDark
                          ? "bg-[#242426] border-[#3F3F46]"
                          : "bg-white border-[#D1D5DB]"
                      } rounded border`}
                    >
                      <div
                        className={`font-semibold ${
                          isDark ? "text-[#8B5CF6]" : "text-[#7C3AED]"
                        }`}
                      >
                        {stages.semantic_analysis.statistics
                          .resources_defined || 0}
                      </div>
                      <div
                        className={isDark ? "text-[#6B7280]" : "text-[#6B7280]"}
                      >
                        Resources
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Code Generation Section */}
        {stages.code_generation && (
          <div>
            <button
              onClick={() => toggleSection("code_generation")}
              className={`w-full p-4 text-left flex items-center justify-between ${
                isDark ? "hover:bg-[#2D2E30]" : "hover:bg-[#F9FAFB]"
              } transition-colors`}
            >
              <div className="flex items-center gap-3">
                <Code2
                  size={16}
                  className={isDark ? "text-[#10B981]" : "text-[#059669]"}
                />
                <span
                  className={`font-semibold ${
                    isDark ? "text-[#F3F4F6]" : "text-[#111827]"
                  }`}
                >
                  Code Generation
                </span>
                <div className={isDark ? "text-[#10B981]" : "text-[#059669]"}>
                  ✓
                </div>
              </div>
              {expandedSections.has("code_generation") ? "▼" : "▶"}
            </button>
            {expandedSections.has("code_generation") && (
              <div
                className={`p-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"}`}
              >
                <div
                  className={`flex justify-between items-center mb-3 text-sm ${
                    isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                  }`}
                >
                  <span>
                    Target format: {stages.code_generation.target_format}
                  </span>
                </div>
                <pre
                  className={`text-sm ${
                    isDark
                      ? "bg-[#242426] text-[#F3F4F6] border-[#3F3F46]"
                      : "bg-white text-[#111827] border-[#D1D5DB]"
                  } p-3 rounded border overflow-x-auto max-h-40`}
                >
                  {stages.code_generation.generated_code}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompilerOutput;
