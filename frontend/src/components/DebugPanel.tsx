// frontend/src/components/DebugPanel.tsx
import React, { useState } from "react";
import { Bug, Code2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface DebugPanelProps {
  debugData: any;
  isLoading: boolean;
  validationResult: any;
  className?: string;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  debugData,
  isLoading,
  validationResult,
  className = "",
}) => {
  const { isDark } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["validation", "tokens", "parsing", "semantic"])
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
              Running debug analysis...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!debugData && !validationResult) {
    return (
      <div
        className={`${
          isDark ? "border-[#3F3F46] bg-[#242426]" : "border-[#D1D5DB] bg-white"
        } border overflow-hidden flex flex-col h-full ${className}`}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Bug
              size={48}
              className={`mx-auto mb-4 ${
                isDark ? "text-[#3F3F46]" : "text-[#D1D5DB]"
              }`}
            />
            <p className={isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"}>
              Debug information will appear here
            </p>
            <p
              className={`text-sm mt-2 ${
                isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"
              }`}
            >
              Click "Debug" or "Validate" to see detailed analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            ? "bg-[#2D2E30] border-[#3F3F46]"
            : "bg-[#F9FAFB] border-[#D1D5DB]"
        } border-b p-4 flex items-center gap-2`}
      >
        <Bug
          size={18}
          className={isDark ? "text-[#60A5FA]" : "text-[#2563EB]"}
        />
        <h3
          className={`font-semibold ${
            isDark ? "text-[#F3F4F6]" : "text-[#111827]"
          }`}
        >
          Debug Panel
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Validation Section */}
        {validationResult && (
          <div
            className={`border-b ${
              isDark ? "border-[#3F3F46]" : "border-[#D1D5DB]"
            }`}
          >
            <button
              onClick={() => toggleSection("validation")}
              className={`w-full p-4 text-left flex items-center justify-between ${
                isDark ? "hover:bg-[#2D2E30]" : "hover:bg-[#F9FAFB]"
              } transition-colors`}
            >
              <div className="flex items-center gap-3">
                {validationResult.valid ? (
                  <CheckCircle
                    size={16}
                    className={isDark ? "text-[#10B981]" : "text-[#059669]"}
                  />
                ) : (
                  <XCircle
                    size={16}
                    className={isDark ? "text-[#F87171]" : "text-[#DC2626]"}
                  />
                )}
                <span
                  className={`font-semibold ${
                    isDark ? "text-[#F3F4F6]" : "text-[#111827]"
                  }`}
                >
                  Validation
                </span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    validationResult.valid
                      ? isDark
                        ? "bg-green-900/30 text-green-400"
                        : "bg-green-100 text-green-700"
                      : isDark
                      ? "bg-red-900/30 text-red-400"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {validationResult.valid ? "Valid" : "Invalid"}
                </span>
              </div>
              <span className={isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"}>
                {expandedSections.has("validation") ? "▼" : "▶"}
              </span>
            </button>
            {expandedSections.has("validation") && (
              <div
                className={`p-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"}`}
              >
                {validationResult.valid ? (
                  <div>
                    <div
                      className={`flex items-center gap-2 mb-3 ${
                        isDark ? "text-[#10B981]" : "text-[#059669]"
                      }`}
                    >
                      <CheckCircle size={20} />
                      <span className="font-semibold">
                        Policy is valid and ready to compile
                      </span>
                    </div>
                    {validationResult.message && (
                      <p
                        className={`text-sm ${
                          isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                        }`}
                      >
                        {validationResult.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Show which stage failed */}
                    {validationResult.stage && (
                      <div
                        className={`text-sm font-semibold ${
                          isDark ? "text-[#F87171]" : "text-[#DC2626]"
                        }`}
                      >
                        Failed at:{" "}
                        {validationResult.stage.replace("_", " ").toUpperCase()}
                      </div>
                    )}

                    {/* Show errors */}
                    {validationResult.errors &&
                      validationResult.errors.length > 0 && (
                        <div className="space-y-2">
                          <h4
                            className={`text-sm font-semibold ${
                              isDark ? "text-[#F87171]" : "text-[#DC2626]"
                            }`}
                          >
                            Errors ({validationResult.errors.length})
                          </h4>
                          {validationResult.errors.map(
                            (error: any, index: number) => (
                              <div
                                key={index}
                                className={`flex items-start gap-2 p-3 rounded border ${
                                  isDark
                                    ? "bg-red-900/20 border-red-800 text-red-300"
                                    : "bg-red-50 border-red-200 text-red-700"
                                }`}
                              >
                                <AlertTriangle
                                  size={16}
                                  className="shrink-0 mt-0.5"
                                />
                                <div className="text-sm">
                                  {typeof error === "string" ? (
                                    error
                                  ) : (
                                    <>
                                      {error.line && (
                                        <span className="font-semibold">
                                          Line {error.line}:{" "}
                                        </span>
                                      )}
                                      {error.message}
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* Show warnings if any */}
                    {validationResult.warnings &&
                      validationResult.warnings.length > 0 && (
                        <div className="space-y-2">
                          <h4
                            className={`text-sm font-semibold ${
                              isDark ? "text-[#FBBF24]" : "text-[#D97706]"
                            }`}
                          >
                            Warnings ({validationResult.warnings.length})
                          </h4>
                          {validationResult.warnings.map(
                            (warning: any, index: number) => (
                              <div
                                key={index}
                                className={`flex items-start gap-2 p-3 rounded border ${
                                  isDark
                                    ? "bg-yellow-900/20 border-yellow-800 text-yellow-300"
                                    : "bg-yellow-50 border-yellow-200 text-yellow-700"
                                }`}
                              >
                                <AlertTriangle
                                  size={16}
                                  className="shrink-0 mt-0.5"
                                />
                                <div className="text-sm">
                                  {warning.line && (
                                    <span className="font-semibold">
                                      Line {warning.line}:{" "}
                                    </span>
                                  )}
                                  {warning.message}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tokens Section */}
        {debugData?.tokens && (
          <div
            className={`border-b ${
              isDark ? "border-[#3F3F46]" : "border-[#D1D5DB]"
            }`}
          >
            <button
              onClick={() => toggleSection("tokens")}
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
                <span
                  className={`text-sm ${
                    isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                  }`}
                >
                  {debugData.tokens.total_tokens} tokens
                </span>
              </div>
              <span className={isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"}>
                {expandedSections.has("tokens") ? "▼" : "▶"}
              </span>
            </button>
            {expandedSections.has("tokens") && (
              <div
                className={`p-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"}`}
              >
                <div
                  className={`overflow-x-auto ${
                    isDark
                      ? "bg-[#242426] border-[#3F3F46]"
                      : "bg-white border-[#D1D5DB]"
                  } border rounded`}
                >
                  <table className="w-full text-sm">
                    <thead className={isDark ? "bg-[#2D2E30]" : "bg-[#F3F4F6]"}>
                      <tr>
                        <th
                          className={`px-4 py-2 text-left ${
                            isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                          }`}
                        >
                          #
                        </th>
                        <th
                          className={`px-4 py-2 text-left ${
                            isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                          }`}
                        >
                          Type
                        </th>
                        <th
                          className={`px-4 py-2 text-left ${
                            isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                          }`}
                        >
                          Value
                        </th>
                        <th
                          className={`px-4 py-2 text-left ${
                            isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                          }`}
                        >
                          Line
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugData.tokens.tokens.map(
                        (token: any, index: number) => (
                          <tr
                            key={index}
                            className={`border-t ${
                              isDark
                                ? "border-[#3F3F46] hover:bg-[#2D2E30]"
                                : "border-[#D1D5DB] hover:bg-[#F9FAFB]"
                            }`}
                          >
                            <td
                              className={`px-4 py-2 ${
                                isDark ? "text-[#6B7280]" : "text-[#9CA3AF]"
                              }`}
                            >
                              {index + 1}
                            </td>
                            <td
                              className={`px-4 py-2 font-mono ${
                                isDark ? "text-[#60A5FA]" : "text-[#2563EB]"
                              }`}
                            >
                              {token.type}
                            </td>
                            <td
                              className={`px-4 py-2 font-mono ${
                                isDark ? "text-[#F3F4F6]" : "text-[#111827]"
                              }`}
                            >
                              {token.value}
                            </td>
                            <td
                              className={`px-4 py-2 ${
                                isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"
                              }`}
                            >
                              {token.line}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Parsing Section */}
        {debugData?.parsing && (
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
                {debugData.parsing.success ? (
                  <CheckCircle
                    size={14}
                    className={isDark ? "text-[#10B981]" : "text-[#059669]"}
                  />
                ) : (
                  <XCircle
                    size={14}
                    className={isDark ? "text-[#F87171]" : "text-[#DC2626]"}
                  />
                )}
              </div>
              <span className={isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"}>
                {expandedSections.has("parsing") ? "▼" : "▶"}
              </span>
            </button>
            {expandedSections.has("parsing") && (
              <div
                className={`p-4 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"}`}
              >
                {debugData.parsing.success ? (
                  <pre
                    className={`text-sm ${
                      isDark
                        ? "bg-[#242426] text-[#F3F4F6] border-[#3F3F46]"
                        : "bg-white text-[#111827] border-[#D1D5DB]"
                    } p-3 rounded border overflow-x-auto max-h-60`}
                  >
                    {debugData.parsing.ast}
                  </pre>
                ) : (
                  <div className="space-y-2">
                    {debugData.parsing.errors?.map(
                      (error: string, index: number) => (
                        <div
                          key={index}
                          className={`flex items-start gap-2 p-3 rounded border ${
                            isDark
                              ? "bg-red-900/20 border-red-800 text-red-300"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          <AlertTriangle
                            size={16}
                            className="shrink-0 mt-0.5"
                          />
                          <span className="text-sm">{error}</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Semantic Analysis Section */}
        {debugData?.semantic && (
          <div>
            <button
              onClick={() => toggleSection("semantic")}
              className={`w-full p-4 text-left flex items-center justify-between ${
                isDark ? "hover:bg-[#2D2E30]" : "hover:bg-[#F9FAFB]"
              } transition-colors`}
            >
              <div className="flex items-center gap-3">
                <Code2
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
                {debugData.semantic.success ? (
                  <CheckCircle
                    size={14}
                    className={isDark ? "text-[#10B981]" : "text-[#059669]"}
                  />
                ) : (
                  <XCircle
                    size={14}
                    className={isDark ? "text-[#F87171]" : "text-[#DC2626]"}
                  />
                )}
              </div>
              <span className={isDark ? "text-[#A1A1AA]" : "text-[#6B7280]"}>
                {expandedSections.has("semantic") ? "▼" : "▶"}
              </span>
            </button>
            {expandedSections.has("semantic") && (
              <div
                className={`p-4 ${
                  isDark ? "bg-[#1E1E1E]" : "bg-[#F9FAFB]"
                } space-y-4`}
              >
                {/* Statistics */}
                {debugData.semantic.statistics && (
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
                        {debugData.semantic.statistics.roles_defined || 0}
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
                        {debugData.semantic.statistics.policies_defined || 0}
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
                        {debugData.semantic.statistics.conflicts_found || 0}
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
                        {debugData.semantic.statistics.resources_defined || 0}
                      </div>
                      <div
                        className={isDark ? "text-[#6B7280]" : "text-[#6B7280]"}
                      >
                        Resources
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {debugData.semantic.errors &&
                  debugData.semantic.errors.length > 0 && (
                    <div>
                      <h4
                        className={`font-semibold mb-2 ${
                          isDark ? "text-[#F87171]" : "text-[#DC2626]"
                        }`}
                      >
                        Errors ({debugData.semantic.errors.length})
                      </h4>
                      <div className="space-y-2">
                        {debugData.semantic.errors.map(
                          (error: any, index: number) => (
                            <div
                              key={index}
                              className={`flex items-start gap-2 p-3 rounded border ${
                                isDark
                                  ? "bg-red-900/20 border-red-800 text-red-300"
                                  : "bg-red-50 border-red-200 text-red-700"
                              }`}
                            >
                              <XCircle size={16} className="shrink-0 mt-0.5" />
                              <div className="text-sm">
                                {error.line && (
                                  <span className="font-semibold">
                                    Line {error.line}:{" "}
                                  </span>
                                )}
                                {error.message}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Warnings */}
                {debugData.semantic.warnings &&
                  debugData.semantic.warnings.length > 0 && (
                    <div>
                      <h4
                        className={`font-semibold mb-2 ${
                          isDark ? "text-[#FBBF24]" : "text-[#D97706]"
                        }`}
                      >
                        Warnings ({debugData.semantic.warnings.length})
                      </h4>
                      <div className="space-y-2">
                        {debugData.semantic.warnings.map(
                          (warning: any, index: number) => (
                            <div
                              key={index}
                              className={`flex items-start gap-2 p-3 rounded border ${
                                isDark
                                  ? "bg-yellow-900/20 border-yellow-800 text-yellow-300"
                                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
                              }`}
                            >
                              <AlertTriangle
                                size={16}
                                className="shrink-0 mt-0.5"
                              />
                              <div className="text-sm">
                                {warning.line && (
                                  <span className="font-semibold">
                                    Line {warning.line}:{" "}
                                  </span>
                                )}
                                {warning.message}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {debugData?.error && (
          <div className="p-4">
            <div
              className={`p-4 rounded border ${
                isDark
                  ? "bg-red-900/20 border-red-800 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-start gap-2">
                <XCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Debug Error</h4>
                  <p className="text-sm">{debugData.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
