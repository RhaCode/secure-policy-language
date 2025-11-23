// frontend/src/pages/ExecutionPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, XCircle, Clock, User, Database, Activity, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';

export default function ExecutionPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [compiledPolicy, setCompiledPolicy] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('read');
  const [selectedResource, setSelectedResource] = useState('');
  const [customTime, setCustomTime] = useState(new Date().getHours());
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [policyActive, setPolicyActive] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showAudit, setShowAudit] = useState(false);

  const actions = ['read', 'write', 'delete', 'execute'];

  // Load compiled policy from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('compiledPolicy');
    if (stored) {
      const policy = JSON.parse(stored);
      setCompiledPolicy(policy);
      activatePolicy(policy);
    }
  }, []);

  // Load users, resources, and stats
  useEffect(() => {
    loadUsers();
    loadResources();
    loadStatistics();
  }, []);

  const activatePolicy = async (policy: any) => {
    try {
      await apiService.activatePolicy('current_policy', '', policy, 'system');
      setPolicyActive(true);
      console.log('✓ Policy activated successfully');
    } catch (error) {
      console.error('Failed to activate policy:', error);
      setPolicyActive(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      if (data.success && data.users) {
        setUsers(data.users);
        if (data.users.length > 0) {
          setSelectedUser(data.users[0].username);
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadResources = async () => {
    try {
      const data = await apiService.getResources();
      if (data.success && data.resources) {
        setResources(data.resources);
        if (data.resources.length > 0) {
          setSelectedResource(data.resources[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await apiService.getStatistics();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await apiService.getAuditLogs(undefined, undefined, 20);
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const checkAccess = async () => {
    if (!selectedUser || !selectedResource) return;

    setIsLoading(true);
    setResult(null);

    try {
      const data = await apiService.checkAccess(
        selectedUser,
        selectedAction,
        selectedResource,
        { hour: customTime }
      );
      setResult(data);
      
      // Refresh stats and logs
      loadStatistics();
      if (showAudit) {
        loadAuditLogs();
      }
    } catch (error) {
      console.error('Access check failed:', error);
      setResult({
        allowed: false,
        reason: 'Failed to check access',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} border-b px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105
                ${isDark ? 'hover:bg-[#3F3F46] text-[#A1A1AA]' : 'hover:bg-[#E5E7EB] text-[#6B7280]'}`}
            >
              <ArrowLeft size={20} />
              <span>Back to Compiler</span>
            </button>
            
            {policyActive && (
              <span className={`text-sm px-3 py-1.5 rounded-lg ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                ✓ Policy Active
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setShowAudit(!showAudit);
              if (!showAudit) loadAuditLogs();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all 
              ${isDark ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'}`}
          >
            <BarChart3 size={16} />
            {showAudit ? 'Hide' : 'Show'} Audit Logs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Access Tester */}
        <div className={`${showAudit ? 'w-1/2' : 'w-full'} overflow-y-auto p-6`}>
          <div className={`max-w-4xl mx-auto ${isDark ? 'bg-[#242426]' : 'bg-white'} rounded-lg shadow-lg`}>
            {/* Card Header */}
            <div className={`${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} border-b p-6`}>
              <div className="flex items-center gap-3">
                <Shield size={24} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                    Access Control Tester
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                    Test your compiled SPL policies in real-time
                  </p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-6">
              {!policyActive && (
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-700 text-yellow-400' : 'bg-yellow-50 border-yellow-300 text-yellow-700'}`}>
                  <p className="text-sm">
                    💡 Compile your SPL code first to activate policies for testing
                  </p>
                </div>
              )}

              {/* Statistics Cards */}
              {statistics && (
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border text-center ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'}`}>
                    <div className={`text-3xl font-bold ${isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'}`}>
                      {statistics.total_requests || 0}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>Total Requests</div>
                  </div>
                  <div className={`p-4 rounded-lg border text-center ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'}`}>
                    <div className={`text-3xl font-bold ${isDark ? 'text-[#10B981]' : 'text-[#059669]'}`}>
                      {statistics.allowed || 0}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>Allowed</div>
                  </div>
                  <div className={`p-4 rounded-lg border text-center ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'}`}>
                    <div className={`text-3xl font-bold ${isDark ? 'text-[#F87171]' : 'text-[#DC2626]'}`}>
                      {statistics.denied || 0}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>Denied</div>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <div className="space-y-4">
                {/* User Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                    <User size={16} className="inline mr-2" />
                    Select User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base ${
                      isDark ? 'bg-[#1E1E1E] border-[#3F3F46] text-[#F3F4F6]' : 'bg-white border-[#D1D5DB] text-[#111827]'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {users.map((user) => (
                      <option key={user.username} value={user.username}>
                        {user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                    <Activity size={16} className="inline mr-2" />
                    Select Action
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base ${
                      isDark ? 'bg-[#1E1E1E] border-[#3F3F46] text-[#F3F4F6]' : 'bg-white border-[#D1D5DB] text-[#111827]'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {actions.map((action) => (
                      <option key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resource Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                    <Database size={16} className="inline mr-2" />
                    Select Resource
                  </label>
                  <select
                    value={selectedResource}
                    onChange={(e) => setSelectedResource(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-base ${
                      isDark ? 'bg-[#1E1E1E] border-[#3F3F46] text-[#F3F4F6]' : 'bg-white border-[#D1D5DB] text-[#111827]'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {resources.map((resource) => (
                      <option key={resource.name} value={resource.name}>
                        {resource.name} ({resource.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Context */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                    <Clock size={16} className="inline mr-2" />
                    Time of Access (Hour: {customTime}:00)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    value={customTime}
                    onChange={(e) => setCustomTime(parseInt(e.target.value))}
                    className="w-full h-2"
                  />
                  <div className={`flex justify-between text-xs mt-2 ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:00</span>
                  </div>
                </div>

                {/* Check Access Button */}
                <button
                  onClick={checkAccess}
                  disabled={isLoading || !selectedUser || !selectedResource || !policyActive}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium text-base transition-all duration-200 
                    disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg hover:shadow-xl
                    bg-[#10B981] text-white hover:bg-[#059669]`}
                >
                  <Shield size={20} />
                  {isLoading ? 'Checking Access...' : 'Check Access'}
                </button>
              </div>

              {/* Result Display */}
              {result && (
                <div className="space-y-4 mt-6">
                  {/* Decision Badge */}
                  <div className={`p-6 rounded-lg border-2 ${
                    result.allowed
                      ? isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300'
                      : isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center gap-4">
                      {result.allowed ? (
                        <CheckCircle size={32} className={isDark ? 'text-green-400' : 'text-green-600'} />
                      ) : (
                        <XCircle size={32} className={isDark ? 'text-red-400' : 'text-red-600'} />
                      )}
                      <div>
                        <h4 className={`font-bold text-2xl ${
                          result.allowed
                            ? isDark ? 'text-green-400' : 'text-green-700'
                            : isDark ? 'text-red-400' : 'text-red-700'
                        }`}>
                          Access {result.allowed ? 'GRANTED' : 'DENIED'}
                        </h4>
                        <p className={`text-base ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                          {result.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Matched Policies */}
                  {result.matched_policies && result.matched_policies.length > 0 && (
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'}`}>
                      <h5 className={`font-semibold mb-3 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                        Matched Policies ({result.matched_policies.length})
                      </h5>
                      <div className="space-y-3">
                        {result.matched_policies.map((policy: any, index: number) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-l-4 ${
                              policy.type === 'ALLOW'
                                ? isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500'
                                : isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'
                            }`}
                          >
                            <div className={`font-semibold text-base mb-2 ${
                              policy.type === 'ALLOW'
                                ? isDark ? 'text-green-400' : 'text-green-700'
                                : isDark ? 'text-red-400' : 'text-red-700'
                            }`}>
                              {policy.type}
                            </div>
                            <div className={`text-sm space-y-1 ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                              <div>Actions: {policy.actions.join(', ')}</div>
                              <div>Resource: {policy.resource}</div>
                              {policy.condition && policy.condition !== 'Always' && (
                                <div>Condition: {policy.condition}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Context Info */}
                  {result.context && (
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'}`}>
                      <h5 className={`font-semibold mb-3 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                        Request Context
                      </h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>User:</span>
                          <span className={`ml-2 font-medium ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                            {result.context.user.name}
                          </span>
                        </div>
                        <div>
                          <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>Role:</span>
                          <span className={`ml-2 font-medium ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                            {result.context.user.role}
                          </span>
                        </div>
                        <div>
                          <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>Time:</span>
                          <span className={`ml-2 font-medium ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                            {result.context.time.hour}:00
                          </span>
                        </div>
                        <div>
                          <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>Resource:</span>
                          <span className={`ml-2 font-medium ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                            {result.context.resource.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Audit Logs */}
        {showAudit && (
          <div className={`w-1/2 border-l ${isDark ? 'border-[#3F3F46] bg-[#1C1C1E]' : 'border-[#D1D5DB] bg-[#F9FAFB]'} overflow-y-auto p-6`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
              Recent Audit Logs
            </h3>
            <div className="space-y-2">
              {auditLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-[#242426] border-[#3F3F46]' : 'bg-white border-[#D1D5DB]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                      {log.username} → {log.resource}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      log.allowed
                        ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                        : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.allowed ? 'ALLOWED' : 'DENIED'}
                    </span>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                    Action: {log.action}
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}