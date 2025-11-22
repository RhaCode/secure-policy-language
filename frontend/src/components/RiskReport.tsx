import React from 'react';
import { Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { RiskReportProps } from '../types';

const RiskReport: React.FC<RiskReportProps> = ({ securityAnalysis, className = '' }) => {
  const { isDark } = useTheme();

  if (!securityAnalysis) {
    return (
      <div className={`${isDark ? 'border-[#3F3F46] bg-[#242426]' : 'border-[#D1D5DB] bg-white'} border rounded-lg p-6 text-center ${className}`}>
        <Shield size={48} className={`mx-auto mb-4 ${isDark ? 'text-[#3F3F46]' : 'text-[#D1D5DB]'}`} />
        <p className={isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}>Security analysis results will appear here</p>
      </div>
    );
  }

  if (!securityAnalysis.success) {
    return (
      <div className={`${isDark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'} border rounded-lg ${className}`}>
        <div className={`p-4 border-b ${isDark ? 'border-red-800' : 'border-red-200'} flex items-center gap-2`}>
          <div className={isDark ? 'text-[#F87171]' : 'text-[#DC2626]'}>✕</div>
          <h3 className={`font-semibold ${isDark ? 'text-[#F87171]' : 'text-[#DC2626]'}`}>Security Analysis Failed</h3>
        </div>
        <div className="p-4">
          <p className={isDark ? 'text-[#F87171]' : 'text-[#DC2626]'}>{securityAnalysis.error}</p>
        </div>
      </div>
    );
  }

  const { security_analysis } = securityAnalysis;
  const riskScore = security_analysis.risk_score || 0;

  return (
    <div className={`${isDark ? 'border-[#3F3F46] bg-[#242426]' : 'border-[#D1D5DB] bg-white'} border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-[#312E81] border-[#3F3F46]' : 'bg-[#E0E7FF] border-[#D1D5DB]'} border-b p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Shield size={20} className={isDark ? 'text-[#C7D2FE]' : 'text-[#3730A3]'} />
          <h3 className={`font-semibold ${isDark ? 'text-[#C7D2FE]' : 'text-[#3730A3]'}`}>Security Risk Analysis</h3>
        </div>
      </div>

      {/* Risk Score */}
      <div className={`p-6 border-b ${isDark ? 'border-[#3F3F46]' : 'border-[#D1D5DB]'}`}>
        <div className={`flex items-center justify-between mb-4 text-sm font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
          <h4>Overall Risk Score</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-[#3F3F46] text-[#A1A1AA]' : 'bg-[#E5E7EB] text-[#374151]'}`}>
            Low
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className={`w-full ${isDark ? 'bg-[#3F3F46]' : 'bg-[#D1D5DB]'} rounded-full h-4`}>
              <div
                className={`h-4 rounded-full ${isDark ? 'bg-[#10B981]' : 'bg-[#059669]'} transition-all duration-500`}
                style={{ width: `${riskScore}%` }}
              ></div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>{riskScore}/100</div>
        </div>
      </div>

      {/* Risks */}
      {security_analysis.risks && security_analysis.risks.length > 0 && (
        <div className={`p-6 border-b ${isDark ? 'border-[#3F3F46]' : 'border-[#D1D5DB]'}`}>
          <h4 className={`font-semibold mb-4 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>Identified Risks</h4>
          <div className="space-y-3">
            {security_analysis.risks.map((risk, index) => (
              <div key={index} className={`border rounded-lg p-4 ${isDark ? 'border-[#3F3F46]' : 'border-[#D1D5DB]'}`}>
                <div className="flex items-start gap-3">
                  <div className={`font-medium capitalize ${
                    risk.severity === 'critical' ? isDark ? 'text-[#F87171]' : 'text-[#DC2626]' :
                    risk.severity === 'high' ? isDark ? 'text-[#FB923C]' : 'text-[#EA580C]' :
                    risk.severity === 'medium' ? isDark ? 'text-[#FBBF24]' : 'text-[#D97706]' : 
                    isDark ? 'text-[#10B981]' : 'text-[#059669]'
                  }`}>
                    {risk.severity}
                  </div>
                  <div className="flex-1">
                    <p className={isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}>{risk.description}</p>
                    {risk.recommendation && (
                      <div className={`mt-2 p-2 rounded text-sm ${isDark ? 'bg-[#312E81] text-[#C7D2FE]' : 'bg-[#E0E7FF] text-[#3730A3]'}`}>
                        <strong>Recommendation:</strong> {risk.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {security_analysis.recommendations && security_analysis.recommendations.length > 0 && (
        <div className="p-6">
          <h4 className={`font-semibold mb-4 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>Security Recommendations</h4>
          <ul className="space-y-2">
            {security_analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className={`mt-1 ${isDark ? 'text-[#10B981]' : 'text-[#059669]'}`}>✓</div>
                <span className={isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!security_analysis.risks || security_analysis.risks.length === 0) && 
       (!security_analysis.recommendations || security_analysis.recommendations.length === 0) && (
        <div className="p-6 text-center">
          <div className={`${isDark ? 'text-[#10B981]' : 'text-[#059669]'} text-5xl mb-4`}>✓</div>
          <p className={isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}>No significant security risks identified</p>
        </div>
      )}
    </div>
  );
};

export default RiskReport;