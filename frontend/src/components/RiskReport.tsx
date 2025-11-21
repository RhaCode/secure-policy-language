import React from 'react';
import type { RiskReportProps } from '../types';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';

const RiskReport: React.FC<RiskReportProps> = ({ securityAnalysis, className = '' }) => {
  if (!securityAnalysis) {
    return (
      <div className={`border rounded-lg p-6 text-center text-gray-500 ${className}`}>
        <Shield size={48} className="mx-auto mb-4 text-gray-300" />
        <p>Security analysis results will appear here</p>
      </div>
    );
  }

  if (!securityAnalysis.success) {
    return (
      <div className={`border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="p-4 border-b border-red-200 flex items-center gap-2">
          <XCircle size={20} className="text-red-600" />
          <h3 className="font-semibold text-red-800">Security Analysis Failed</h3>
        </div>
        <div className="p-4">
          <p className="text-red-700">{securityAnalysis.error}</p>
        </div>
      </div>
    );
  }

  const { security_analysis, provider } = securityAnalysis;
  const riskScore = security_analysis.risk_score || 0;

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Critical', color: 'bg-red-600', text: 'text-red-600' };
    if (score >= 60) return { level: 'High', color: 'bg-orange-500', text: 'text-orange-500' };
    if (score >= 40) return { level: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-500' };
    return { level: 'Low', color: 'bg-green-500', text: 'text-green-500' };
  };

  const riskLevel = getRiskLevel(riskScore);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle size={16} className="text-red-600" />;
      case 'high':
        return <AlertCircle size={16} className="text-orange-500" />;
      case 'medium':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <CheckCircle2 size={16} className="text-green-500" />;
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-600" />
          <h3 className="font-semibold text-blue-800">Security Risk Analysis</h3>
        </div>
        <span className="text-sm text-blue-600">Powered by {provider}</span>
      </div>

      {/* Risk Score */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-700">Overall Risk Score</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevel.text} bg-opacity-10 ${riskLevel.color.replace('bg-', 'bg-')}`}>
            {riskLevel.level}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${riskLevel.color} transition-all duration-500`}
                style={{ width: `${riskScore}%` }}
              ></div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-700">{riskScore}/100</div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </div>

      {/* Security Risks */}
      {security_analysis.risks && security_analysis.risks.length > 0 && (
        <div className="p-6 border-b">
          <h4 className="font-semibold text-gray-700 mb-4">Identified Risks</h4>
          <div className="space-y-3">
            {security_analysis.risks.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(risk.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium capitalize ${
                        risk.severity === 'critical' ? 'text-red-700' :
                        risk.severity === 'high' ? 'text-orange-700' :
                        risk.severity === 'medium' ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        {risk.severity} risk
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{risk.description}</p>
                    {risk.recommendation && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Recommendation:</strong> {risk.recommendation}
                        </p>
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
          <h4 className="font-semibold text-gray-700 mb-4">Security Recommendations</h4>
          <ul className="space-y-2">
            {security_analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-500 mt-1 shrink-0" />
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!security_analysis.risks || security_analysis.risks.length === 0) && 
       (!security_analysis.recommendations || security_analysis.recommendations.length === 0) && (
        <div className="p-6 text-center text-gray-500">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
          <p>No significant security risks identified</p>
        </div>
      )}
    </div>
  );
};

export default RiskReport;