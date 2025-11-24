import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, User, Database, Activity, 
  BarChart3, AlertCircle, RefreshCw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';

export default function ExecutionPage() {
  const { isDark } = useTheme();
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
  const [statistics, setStatistics] = useState({ total_requests: 0, allowed: 0, denied: 0 });
  const [showAudit, setShowAudit] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');

  const actions = ['read', 'write', 'delete', 'execute'];

  // Apply theme to document for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update selected values when data loads
  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0].username);
    }
  }, [users, selectedUser]);

  useEffect(() => {
    if (resources.length > 0 && !selectedResource) {
      setSelectedResource(resources[0].name);
    }
  }, [resources, selectedResource]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      setDataError('');

      // Load users and resources from CRUD API
      const [usersResult, resourcesResult, statsResult, policiesResult, logsResult] = await Promise.all([
        apiService.getUsersCRUD(),
        apiService.getResourcesCRUD(),
        apiService.getStatisticsCRUD(),
        apiService.getPolicies(),
        apiService.getAuditLogs(undefined, undefined, 20)
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data || []);
      }

      if (resourcesResult.success) {
        setResources(resourcesResult.data || []);
      }

      if (statsResult.success) {
        setStatistics(statsResult.data.access_logs || { total_requests: 0, allowed: 0, denied: 0 });
      }

      // Check policy status
      setPolicyActive(Array.isArray(policiesResult) && policiesResult.length > 0);

      if (logsResult.success) {
        setAuditLogs(logsResult.logs || []);
      }
    } catch (error) {
      setDataError('Failed to load data');
      console.error('Data loading error:', error);
    } finally {
      setLoadingData(false);
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

      // Reload audit logs and stats
      await Promise.all([
        loadAuditLogs(),
        loadStatistics(),
      ]);
    } catch (error) {
      setResult({
        allowed: false,
        reason: 'Failed to check access',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const result = await apiService.getAuditLogs(undefined, undefined, 20);
      if (result.success) {
        setAuditLogs(result.logs || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs');
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await apiService.getStatisticsCRUD();
      if (result.success) {
        setStatistics(result.data.access_logs || { total_requests: 0, allowed: 0, denied: 0 });
      }
    } catch (error) {
      console.error('Failed to load statistics');
    }
  };

  if (loadingData) {
    return (
      <div className="h-full flex items-center justify-center bg-primary">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-primary" size={32} />
          <p className="text-primary">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-primary">
      {/* Header */}
      <div className="shrink-0 bg-secondary border-b border-primary px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-blue-600 flex items-center justify-center">
              <Shield size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Access Control Engine</h1>
              <p className="text-sm text-secondary">Test and manage policy execution</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {policyActive ? (
              <div className="px-4 py-2 rounded-lg bg-success/30 border border-success text-success text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Policy Active
              </div>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-warning/30 border border-warning text-warning text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                Policy Inactive
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel */}
        <div className={`${showAudit ? 'w-1/2' : 'w-full'} overflow-y-auto transition-all duration-300`}>
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            {dataError && (
              <div className="p-4 rounded-lg bg-destructive/20 border border-destructive text-destructive text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {dataError}
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-card border border-primary text-center hover:border-primary/50 transition-colors">
                <div className="text-3xl font-bold text-primary mb-1">{statistics.total_requests}</div>
                <div className="text-xs text-secondary">Total Requests</div>
              </div>
              <div className="p-4 rounded-lg bg-card border border-primary text-center hover:border-success/50 transition-colors">
                <div className="text-3xl font-bold text-success mb-1">{statistics.allowed}</div>
                <div className="text-xs text-secondary">Allowed</div>
              </div>
              <div className="p-4 rounded-lg bg-card border border-primary text-center hover:border-destructive/50 transition-colors">
                <div className="text-3xl font-bold text-destructive mb-1">{statistics.denied}</div>
                <div className="text-xs text-secondary">Denied</div>
              </div>
            </div>

            {/* Test Controls */}
            <div className="bg-card rounded-lg border border-primary p-6 space-y-5">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Access Check
              </h3>

              {/* User Selection */}
              <div>
                <label className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.username} value={user.username}>
                      {user.username} ({user.role})
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="mt-2 text-xs text-warning flex items-center gap-1">
                    <AlertCircle size={14} /> No users available. Create users in the Management panel.
                  </p>
                )}
              </div>

              {/* Action Selection */}
              <div>
                <label className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" />
                  Action
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {actions.map((action) => (
                    <button
                      key={action}
                      onClick={() => setSelectedAction(action)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedAction === action
                          ? 'bg-primary text-primary-foreground border border-primary'
                          : 'bg-input text-secondary border border-primary hover:border-primary/60'
                      }`}
                    >
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Selection */}
              <div>
                <label className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                  <Database size={16} className="text-primary" />
                  Resource
                </label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a resource...</option>
                  {resources.map((resource) => (
                    <option key={resource.name} value={resource.name}>
                      {resource.name} ({resource.type})
                    </option>
                  ))}
                </select>
                {resources.length === 0 && (
                  <p className="mt-2 text-xs text-warning flex items-center gap-1">
                    <AlertCircle size={14} /> No resources available. Create resources in the Management panel.
                  </p>
                )}
              </div>

              {/* Time Picker */}
              <div>
                <label className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  Time: {String(customTime).padStart(2, '0')}:00
                </label>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={customTime}
                  onChange={(e) => setCustomTime(parseInt(e.target.value))}
                  className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted mt-2">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>

              {/* Check Button */}
              <button
                onClick={checkAccess}
                disabled={isLoading || !policyActive || !selectedUser || !selectedResource}
                className="w-full py-3 rounded-lg bg-linear-to-r from-primary to-blue-600 text-primary-foreground font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Check Access
                  </>
                )}
              </button>
            </div>

            {/* Result Display */}
            {result && (
              <div className="space-y-4">
                {/* Decision Card */}
                <div className={`p-6 rounded-lg border-2 ${
                  result.allowed
                    ? 'bg-success/20 border-success'
                    : 'bg-destructive/20 border-destructive'
                }`}>
                  <div className="flex items-center gap-4">
                    {result.allowed ? (
                      <CheckCircle size={40} className="text-success shrink-0" />
                    ) : (
                      <XCircle size={40} className="text-destructive shrink-0" />
                    )}
                    <div>
                      <h4 className={`font-bold text-2xl ${
                        result.allowed ? 'text-success' : 'text-destructive'
                      }`}>
                        {result.allowed ? '✓ GRANTED' : '✗ DENIED'}
                      </h4>
                      <p className="text-sm text-secondary mt-1">{result.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Matched Policies */}
                {result.matched_policies?.length > 0 && (
                  <div className="bg-card rounded-lg border border-primary p-4 space-y-3">
                    <h5 className="text-sm font-semibold text-primary">Matched Policies</h5>
                    {result.matched_policies.map((policy: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${
                          policy.type === 'ALLOW'
                            ? 'bg-success/20 border-success'
                            : 'bg-destructive/20 border-destructive'
                        }`}
                      >
                        <div className={`text-xs font-bold mb-2 ${
                          policy.type === 'ALLOW' ? 'text-success' : 'text-destructive'
                        }`}>
                          {policy.type}
                        </div>
                        <div className="text-xs space-y-1 text-secondary">
                          <div>Actions: {policy.actions.join(', ')}</div>
                          <div>Resource: {policy.resource}</div>
                          {policy.condition && <div>Condition: {policy.condition}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Context Info */}
                {result.context && (
                  <div className="bg-card rounded-lg border border-primary p-4">
                    <h5 className="text-sm font-semibold text-primary mb-3">Request Context</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">User:</span>
                        <span className="text-primary font-medium">{result.context?.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Role:</span>
                        <span className="text-primary font-medium">{result.context?.user.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Resource:</span>
                        <span className="text-primary font-medium">{result.context?.resource.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Time:</span>
                        <span className="text-primary font-medium">{String(result.context?.time.hour).padStart(2, '0')}:00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Audit Logs */}
        {showAudit && (
          <div className="w-1/2 border-l border-primary bg-tertiary flex flex-col overflow-hidden">
            <div className="shrink-0 p-6 border-b border-primary flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <BarChart3 size={20} className="text-primary" />
                  Audit Logs
                </h3>
                <p className="text-xs text-muted mt-1">Last 20 access attempts</p>
              </div>
              <button
                onClick={() => setShowAudit(false)}
                className="p-2 hover-bg rounded-lg transition-colors text-secondary"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-6">
              {auditLogs.length > 0 ? (
                auditLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-card border border-primary hover:border-primary/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary text-sm">
                        {log.username} → {log.resource}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        log.allowed
                          ? 'bg-success/30 text-success'
                          : 'bg-destructive/30 text-destructive'
                      }`}>
                        {log.allowed ? '✓ OK' : '✗ DENIED'}
                      </span>
                    </div>
                    <div className="text-xs text-secondary space-y-1">
                      <div>Action: <span className="text-primary">{log.action}</span></div>
                      <div className="text-muted">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted py-8">No audit logs yet</p>
              )}
            </div>
          </div>
        )}

        {/* Show Audit Logs Button */}
        {!showAudit && (
          <button
            onClick={() => setShowAudit(true)}
            className="absolute bottom-6 right-6 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <BarChart3 size={20} />
            Show Logs
          </button>
        )}
      </div>
    </div>
  );
}