// frontend/src/pages/ExecutionPage.tsx
import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, User, Database, Activity, 
  BarChart3, AlertCircle, RefreshCw, Laptop, Globe
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
  
  // NEW: Device and IP context
  const [requestIp, setRequestIp] = useState('192.168.1.100');
  const [deviceType, setDeviceType] = useState('corporate_laptop');
  const [deviceTrusted, setDeviceTrusted] = useState(true);
  const [deviceOs, setDeviceOs] = useState('Windows');
  const [deviceBrowser, setDeviceBrowser] = useState('Chrome');
  const [deviceLocation, setDeviceLocation] = useState('office');
  
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [policyActive, setPolicyActive] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({ total_requests: 0, allowed: 0, denied: 0 });
  
  const [usersLoading, setUsersLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  
  const [usersError, setUsersError] = useState('');
  const [resourcesError, setResourcesError] = useState('');
  const [policyError, setPolicyError] = useState('');

  const actions = ['read', 'write', 'delete', 'execute', 'create', 'update', 'list'];
  const deviceTypes = ['corporate_laptop', 'mobile', 'desktop', 'tablet', 'workstation'];
  const deviceOsList = ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'mobile'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Internet Explorer'];
  const locations = ['office', 'remote', 'home', 'public'];

  useEffect(() => {
    loadInitialData();
  }, []);

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
      // Build extended context with time, IP, and device info
      const context = {
        time: {
          hour: customTimeHour,
          minute: customTimeMinute
        },
        request: {
          ip: requestIp
        },
        device: {
          type: deviceType,
          trusted: deviceTrusted,
          os: deviceOs,
          browser: deviceBrowser,
          location: deviceLocation
        }
      };

      const data = await apiService.checkAccess(
        selectedUser, 
        selectedAction, 
        selectedResource, 
        context
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
    <div className="h-full overflow-y-auto bg-primary">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-600 to-blue-500 flex items-center justify-center shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">Access Control Engine</h1>
              <p className="text-xs sm:text-sm text-secondary">Test policies with IP and device contexts</p>
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Test Controls */}
          <div className="space-y-4">
            {/* User & Resource */}
            <div className="bg-card rounded-lg border border-primary p-4 space-y-4">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <User size={18} className="text-primary" />
                Access Request
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 flex items-center gap-2">
                    <User size={14} />
                    User
                    {usersLoading && <RefreshCw size={12} className="animate-spin" />}
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    disabled={usersLoading || users.length === 0}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">Select user...</option>
                    {users.map((user) => (
                      <option key={user.username} value={user.username}>
                        {user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 flex items-center gap-2">
                    <Database size={14} />
                    Resource
                    {resourcesLoading && <RefreshCw size={12} className="animate-spin" />}
                  </label>
                  <select
                    value={selectedResource}
                    onChange={(e) => setSelectedResource(e.target.value)}
                    disabled={resourcesLoading || resources.length === 0}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">Select resource...</option>
                    {resources.map((resource) => (
                      <option key={resource.name} value={resource.name}>
                        {resource.name} ({resource.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-primary mb-1.5 flex items-center gap-2">
                  <BarChart3 size={14} />
                  Action
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {actions.map((action) => (
                    <button
                      key={action}
                      onClick={() => setSelectedAction(action)}
                      disabled={isLoadingCriticalData}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                        selectedAction === action
                          ? 'bg-primary text-primary-foreground border border-primary'
                          : 'bg-input text-secondary border border-primary hover:border-primary/60'
                      } disabled:opacity-50`}
                    >
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Context: Time */}
            <div className="bg-card rounded-lg border border-primary p-4 space-y-4">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Time Context
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customTimeHour}
                  onChange={(e) => setCustomTimeHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="HH"
                />
                <span className="text-primary">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customTimeMinute}
                  onChange={(e) => setCustomTimeMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="MM"
                />
              </div>
            </div>

            {/* Context: Request (IP) */}
            <div className="bg-card rounded-lg border border-primary p-4 space-y-4">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <Globe size={18} className="text-primary" />
                Request Context
              </h3>

              <div>
                <label className="text-xs font-medium text-primary mb-1.5 block">
                  IP Address
                </label>
                <input
                  type="text"
                  value={requestIp}
                  onChange={(e) => setRequestIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted mt-1">Example: 192.168.1.0/24, 10.0.0.0/8</p>
              </div>
            </div>

            {/* Context: Device */}
            <div className="bg-card rounded-lg border border-primary p-4 space-y-4">
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <Laptop size={18} className="text-primary" />
                Device Context
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">Type</label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {deviceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">OS</label>
                  <select
                    value={deviceOs}
                    onChange={(e) => setDeviceOs(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {deviceOsList.map((os) => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">Browser</label>
                  <select
                    value={deviceBrowser}
                    onChange={(e) => setDeviceBrowser(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {browsers.map((browser) => (
                      <option key={browser} value={browser}>{browser}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-primary mb-1.5 block">Location</label>
                  <select
                    value={deviceLocation}
                    onChange={(e) => setDeviceLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deviceTrusted"
                  checked={deviceTrusted}
                  onChange={(e) => setDeviceTrusted(e.target.checked)}
                  className="w-4 h-4 rounded border-primary"
                />
                <label htmlFor="deviceTrusted" className="text-sm text-primary">
                  Device is trusted
                </label>
              </div>
            </div>

            {/* Check Button */}
            <button
              onClick={checkAccess}
              disabled={isLoading || !policyActive || !selectedUser || !selectedResource || isLoadingCriticalData}
              className="w-full py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-500 text-white font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Checking Access...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Check Access
                </>
              )}
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className={`p-6 rounded-lg border-2 ${
                  result.allowed ? 'bg-success/20 border-success' : 'bg-destructive/20 border-destructive'
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
                        }`}>
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
                        <span className="text-muted">Time:</span>
                        <span className="text-primary font-medium">
                          {String(result.context?.time.hour).padStart(2, '0')}:{String(result.context?.time.minute).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">IP:</span>
                        <span className="text-primary font-medium">{result.context?.request?.ip || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Device:</span>
                        <span className="text-primary font-medium">{result.context?.device?.type || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Trusted:</span>
                        <span className="text-primary font-medium">
                          {result.context?.device?.trusted ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center text-center py-12 bg-card rounded-lg border border-primary">
                <div className="text-secondary">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-primary mb-2">No Access Check Performed</h3>
                  <p className="text-sm">Configure inputs and click "Check Access"</p>
                </div>
              </div>
            )}

            {/* Audit Logs */}
            <div className="bg-card rounded-lg border border-primary overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                  <BarChart3 size={18} />
                  Audit Logs
                </h3>
                <div className="flex gap-2">
                  <div className="px-2 py-1 rounded bg-tertiary text-xs">
                    <span className="text-muted">Total: </span>
                    <span className="text-primary font-bold">{statistics.total_requests}</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-success/20 text-xs">
                    <span className="text-success font-bold">{statistics.allowed}</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-destructive/20 text-xs">
                    <span className="text-destructive font-bold">{statistics.denied}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 max-h-96 overflow-y-auto">
                {auditLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="animate-spin text-primary" size={20} />
                  </div>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-tertiary hover:bg-primary/5 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-primary text-sm">
                            {log.username} → {log.resource}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            log.allowed ? 'bg-success/30 text-success' : 'bg-destructive/30 text-destructive'
                          }`}>
                            {log.allowed ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="text-xs text-secondary">
                          Action: {log.action} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted py-8 text-sm">No audit logs yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}