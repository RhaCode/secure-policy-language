// frontend/src/pages/ExecutionPage.tsx
import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, User, Database, Activity, 
  BarChart3, AlertCircle, RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';

export default function ExecutionPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('read');
  const [selectedResource, setSelectedResource] = useState('');
  const [customTimeHour, setCustomTimeHour] = useState(new Date().getHours());
  const [customTimeMinute, setCustomTimeMinute] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [policyActive, setPolicyActive] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({ total_requests: 0, allowed: 0, denied: 0 });
  
  // Separate loading states for different data types
  const [usersLoading, setUsersLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  
  const [usersError, setUsersError] = useState('');
  const [resourcesError, setResourcesError] = useState('');
  const [policyError, setPolicyError] = useState('');

  // SPL Action keywords
  const actions = ['read', 'write', 'delete', 'execute', 'create', 'update', 'list'];

  // Load data on mount - non-blocking
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
    Promise.all([
      loadUsers(),
      loadResources(),
      loadPolicyStatus(),
      loadAuditLogs(),
      loadStatistics()
    ]);
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError('');
      const usersResult = await apiService.getUsers();
      if (usersResult.success) {
        setUsers(usersResult.users || []);
      } else {
        setUsersError('Failed to load users');
      }
    } catch (error) {
      setUsersError('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      setResourcesLoading(true);
      setResourcesError('');
      const resourcesResult = await apiService.getResources();
      if (resourcesResult.success) {
        setResources(resourcesResult.resources || []);
      } else {
        setResourcesError('Failed to load resources');
      }
    } catch (error) {
      setResourcesError('Failed to load resources');
      console.error('Error loading resources:', error);
    } finally {
      setResourcesLoading(false);
    }
  };

  const loadPolicyStatus = async () => {
    try {
      setPolicyLoading(true);
      setPolicyError('');
      const policiesResult = await apiService.getPolicies();
      setPolicyActive(Array.isArray(policiesResult) && policiesResult.length > 0);
    } catch (error) {
      setPolicyError('Failed to load policy status');
      console.error('Error loading policies:', error);
    } finally {
      setPolicyLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const result = await apiService.getAuditLogs(undefined, undefined, 20);
      if (result.success) {
        setAuditLogs(result.logs || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await apiService.getStatistics();
      if (result.success) {
        setStatistics(result.statistics.access_logs || { total_requests: 0, allowed: 0, denied: 0 });
      }
    } catch (error) {
      console.error('Failed to load statistics');
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
        { hour: customTimeHour, minute: customTimeMinute }
      );
      setResult(data);

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

  const isLoadingCriticalData = usersLoading || resourcesLoading || policyLoading;

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-primary">
      {/* Left Side - Inputs and Controls */}
      <div className="w-full lg:w-1/2 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Header with Policy Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-600 to-blue-500 flex items-center justify-center shrink-0">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary">Access Control Engine</h1>
                <p className="text-xs sm:text-sm text-secondary">Test and manage policy execution</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {policyLoading ? (
                <div className="px-3 sm:px-4 py-2 rounded-lg bg-tertiary border border-primary text-secondary text-xs sm:text-sm font-medium flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Loading...
                </div>
              ) : policyActive ? (
                <div className="px-3 sm:px-4 py-2 rounded-lg bg-success/30 border border-success text-success text-xs sm:text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Policy Active
                </div>
              ) : (
                <div className="px-3 sm:px-4 py-2 rounded-lg bg-warning/30 border border-warning text-warning text-xs sm:text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  Policy Inactive
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {(usersError || resourcesError || policyError) && (
            <div className="space-y-2">
              {usersError && (
                <div className="p-3 rounded-lg bg-destructive/20 border border-destructive text-destructive text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  {usersError}
                </div>
              )}
              {resourcesError && (
                <div className="p-3 rounded-lg bg-destructive/20 border border-destructive text-destructive text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  {resourcesError}
                </div>
              )}
              {policyError && (
                <div className="p-3 rounded-lg bg-destructive/20 border border-destructive text-destructive text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  {policyError}
                </div>
              )}
            </div>
          )}

          {/* Test Controls */}
          <div className="bg-card rounded-lg border border-primary p-4 sm:p-6 space-y-4 sm:space-y-5">
            <h3 className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Access Check
            </h3>

            {/* User Selection */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <User size={16} className="text-primary" />
                User
                {usersLoading && <RefreshCw size={14} className="animate-spin text-primary" />}
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={usersLoading || users.length === 0}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-input border border-primary text-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              {usersLoading && (
                <p className="mt-2 text-xs text-secondary flex items-center gap-1">
                  Loading users...
                </p>
              )}
              {!usersLoading && users.length === 0 && (
                <p className="mt-2 text-xs text-warning flex items-center gap-1">
                  <AlertCircle size={14} /> No users available. Create users in the Management panel.
                </p>
              )}
            </div>

            {/* Action Selection */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                Action
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {actions.map((action) => (
                  <button
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    disabled={isLoadingCriticalData}
                    className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      selectedAction === action
                        ? 'bg-primary text-primary-foreground border border-primary'
                        : 'bg-input text-secondary border border-primary hover:border-primary/60'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Selection */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <Database size={16} className="text-primary" />
                Resource
                {resourcesLoading && <RefreshCw size={14} className="animate-spin text-primary" />}
              </label>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                disabled={resourcesLoading || resources.length === 0}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-input border border-primary text-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Select a resource...</option>
                {resources.map((resource) => (
                  <option key={resource.name} value={resource.name}>
                    {resource.name} ({resource.type})
                  </option>
                ))}
              </select>
              {resourcesLoading && (
                <p className="mt-2 text-xs text-secondary flex items-center gap-1">
                  Loading resources...
                </p>
              )}
              {!resourcesLoading && resources.length === 0 && (
                <p className="mt-2 text-xs text-warning flex items-center gap-1">
                  <AlertCircle size={14} /> No resources available. Create resources in the Management panel.
                </p>
              )}
            </div>

            {/* Time Picker */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-primary mb-3 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Request Time
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1">
                  <label className="text-xs text-secondary mb-1 block">Hour</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={customTimeHour}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (val < 0) val = 0;
                      if (val > 23) val = 23;
                      setCustomTimeHour(val);
                    }}
                    disabled={isLoadingCriticalData}
                    className="w-full px-2 sm:px-3 py-2 rounded-lg bg-input border border-primary text-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
                <div className="text-primary text-base sm:text-lg font-semibold pt-4">:</div>
                <div className="flex-1">
                  <label className="text-xs text-secondary mb-1 block">Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customTimeMinute}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (val < 0) val = 0;
                      if (val > 59) val = 59;
                      setCustomTimeMinute(val);
                    }}
                    disabled={isLoadingCriticalData}
                    className="w-full px-2 sm:px-3 py-2 rounded-lg bg-input border border-primary text-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
                <div className="text-xl sm:text-2xl font-mono text-primary font-bold pt-4 min-w-[70px] text-center">
                  {String(customTimeHour).padStart(2, '0')}:{String(customTimeMinute).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Check Button */}
            <button
              onClick={checkAccess}
              disabled={isLoading || !policyActive || !selectedUser || !selectedResource || isLoadingCriticalData}
              className="w-full py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-sm sm:text-base"
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
        </div>
      </div>

      {/* Right Side - Results and Audit Logs */}
      <div className="w-full lg:w-1/2 overflow-y-auto p-4 sm:p-6 lg:border-l border-primary">
        <div className="space-y-4 sm:space-y-6">
          {result ? (
            <>
              {/* Decision Card */}
              <div className={`p-4 sm:p-6 rounded-lg border-2 ${
                result.allowed
                  ? 'bg-success/20 border-success'
                  : 'bg-destructive/20 border-destructive'
              }`}>
                <div className="flex items-center gap-3 sm:gap-4">
                  {result.allowed ? (
                    <CheckCircle size={32} className="text-success shrink-0 sm:w-10 sm:h-10" />
                  ) : (
                    <XCircle size={32} className="text-destructive shrink-0 sm:w-10 sm:h-10" />
                  )}
                  <div className="min-w-0">
                    <h4 className={`font-bold text-xl sm:text-2xl ${
                      result.allowed ? 'text-success' : 'text-destructive'
                    }`}>
                      {result.allowed ? '✓ GRANTED' : '✗ DENIED'}
                    </h4>
                    <p className="text-xs sm:text-sm text-secondary mt-1 wrap-break-words">{result.reason}</p>
                  </div>
                </div>
              </div>

              {/* Matched Policies */}
              {result.matched_policies?.length > 0 && (
                <div className="bg-card rounded-lg border border-primary p-4 space-y-3">
                  <h5 className="text-xs sm:text-sm font-semibold text-primary">Matched Policies</h5>
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
                      <div className="text-xs space-y-1 text-secondary wrap-break-words">
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
                  <h5 className="text-xs sm:text-sm font-semibold text-primary mb-3">Request Context</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">User:</span>
                      <span className="text-primary font-medium truncate ml-2">{result.context?.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Role:</span>
                      <span className="text-primary font-medium truncate ml-2">{result.context?.user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Resource:</span>
                      <span className="text-primary font-medium truncate ml-2">{result.context?.resource.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Time:</span>
                      <span className="text-primary font-medium">{String(result.context?.time.hour).padStart(2, '0')}:{String(result.context?.time.minute).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center text-center py-12">
              <div className="text-secondary">
                <Activity size={40} className="mx-auto mb-4 opacity-50 sm:w-12 sm:h-12" />
                <h3 className="text-base sm:text-lg font-medium text-primary mb-2">No Access Check Performed</h3>
                <p className="text-xs sm:text-sm">Configure the inputs and click "Check Access" to see results here</p>
              </div>
            </div>
          )}

          {/* Audit Logs Section */}
          <div className="bg-card rounded-lg border border-primary overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
                  <BarChart3 size={20} className="text-primary" />
                  Audit Logs
                  {auditLoading && <RefreshCw size={14} className="animate-spin text-primary" />}
                </h3>
                <p className="text-xs text-muted mt-1">Last 20 access attempts</p>
              </div>
              
              {/* Statistics Cards */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-lg bg-tertiary">
                  <span className="text-xs text-secondary">Total:</span>
                  <span className="text-sm font-bold text-primary">{statistics.total_requests}</span>
                </div>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-lg bg-success/20">
                  <span className="text-xs text-success">Allowed:</span>
                  <span className="text-sm font-bold text-success">{statistics.allowed}</span>
                </div>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-lg bg-destructive/20">
                  <span className="text-xs text-destructive">Denied:</span>
                  <span className="text-sm font-bold text-destructive">{statistics.denied}</span>
                </div>
              </div>
            </div>

              <div className="p-4 pt-0">
                {auditLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="animate-spin text-primary" size={20} />
                    <span className="ml-2 text-xs sm:text-sm text-secondary">Loading audit logs...</span>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-3 sm:p-4 rounded-lg bg-tertiary hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <span className="font-medium text-primary text-xs sm:text-sm wrap-wrap-break-words">
                              {log.username} → {log.resource}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded font-medium self-start sm:self-auto ${
                              log.allowed
                                ? 'bg-success/30 text-success'
                                : 'bg-destructive/30 text-destructive'
                            }`}>
                              {log.allowed ? '✓ OK' : '✗ DENIED'}
                            </span>
                          </div>
                          <div className="text-xs text-secondary space-y-1">
                            <div>Action: <span className="text-primary">{log.action}</span></div>
                            <div className="text-muted">{new Date(log.timestamp).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted py-8 text-xs sm:text-sm">No audit logs yet</p>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}