// frontend/src/components/AccessTester.tsx
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, User, Database, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AccessTesterProps {
  className?: string;
}

const AccessTester: React.FC<AccessTesterProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('read');
  const [selectedResource, setSelectedResource] = useState('');
  const [customTime, setCustomTime] = useState(new Date().getHours());
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const actions = ['read', 'write', 'delete', 'execute'];

  // Load users and resources
  useEffect(() => {
    loadUsers();
    loadResources();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/execution/users');
      const data = await response.json();
      if (data.success) {
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
      const response = await fetch('http://localhost:5000/api/execution/resources');
      const data = await response.json();
      if (data.success) {
        setResources(data.resources);
        if (data.resources.length > 0) {
          setSelectedResource(data.resources[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const checkAccess = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/execution/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: selectedUser,
          action: selectedAction,
          resource: selectedResource,
          context: {
            hour: customTime,
          },
        }),
      });

      const data = await response.json();
      setResult(data);
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
    <div className={`${isDark ? 'border-[#3F3F46] bg-[#242426]' : 'border-[#D1D5DB] bg-white'} border rounded-lg overflow-hidden flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className={`shrink-0 ${isDark ? 'bg-[#2D2E30] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'} border-b p-4 flex items-center gap-2`}>
        <Shield size={18} className={isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]'} />
        <h3 className={`font-semibold ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>Access Control Tester</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Input Form */}
        <div className="space-y-4 mb-6">
          {/* User Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
              <User size={16} className="inline mr-2" />
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#1E1E1E] border-[#3F3F46] text-[#F3F4F6]'
                  : 'bg-white border-[#D1D5DB] text-[#111827]'
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
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#1E1E1E] border-[#3F3F46] text-[#F3F4F6]'
                  : 'bg-white border-[#D1D5DB] text-[#111827]'
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
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-[#1E1E1E] border-[#3F3F46] text-[#F3F4F6]'
                  : 'bg-white border-[#D1D5DB] text-[#111827]'
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
              className="w-full"
            />
            <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Check Access Button */}
          <button
            onClick={checkAccess}
            disabled={isLoading || !selectedUser || !selectedResource}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-95 shadow-md hover:shadow-lg
              ${isDark 
                ? 'bg-[#3F3F46] text-[#F3F4F6] hover:bg-[#52525B]' 
                : 'bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]'
              }`}
          >
            <Shield size={16} />
            {isLoading ? 'Checking Access...' : 'Check Access'}
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            {/* Decision Badge */}
            <div className={`p-4 rounded-lg border-2 ${
              result.allowed
                ? isDark
                  ? 'bg-green-900/20 border-green-700'
                  : 'bg-green-50 border-green-300'
                : isDark
                ? 'bg-red-900/20 border-red-700'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center gap-3">
                {result.allowed ? (
                  <CheckCircle size={24} className={isDark ? 'text-green-400' : 'text-green-600'} />
                ) : (
                  <XCircle size={24} className={isDark ? 'text-red-400' : 'text-red-600'} />
                )}
                <div>
                  <h4 className={`font-bold text-lg ${
                    result.allowed
                      ? isDark ? 'text-green-400' : 'text-green-700'
                      : isDark ? 'text-red-400' : 'text-red-700'
                  }`}>
                    Access {result.allowed ? 'GRANTED' : 'DENIED'}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                    {result.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Matched Policies */}
            {result.matched_policies && result.matched_policies.length > 0 && (
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'}`}>
                <h5 className={`font-semibold mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                  Matched Policies ({result.matched_policies.length})
                </h5>
                <div className="space-y-2">
                  {result.matched_policies.map((policy: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        policy.type === 'ALLOW'
                          ? isDark
                            ? 'bg-green-900/20 border-green-500'
                            : 'bg-green-50 border-green-500'
                          : isDark
                          ? 'bg-red-900/20 border-red-500'
                          : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className={`font-semibold text-sm ${
                        policy.type === 'ALLOW'
                          ? isDark ? 'text-green-400' : 'text-green-700'
                          : isDark ? 'text-red-400' : 'text-red-700'
                      }`}>
                        {policy.type}
                      </div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                        Actions: {policy.actions.join(', ')}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                        Resource: {policy.resource}
                      </div>
                      {policy.condition && policy.condition !== 'Always' && (
                        <div className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#6B7280]'}`}>
                          Condition: {policy.condition}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context Info */}
            {result.context && (
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#1E1E1E] border-[#3F3F46]' : 'bg-[#F9FAFB] border-[#D1D5DB]'}`}>
                <h5 className={`font-semibold mb-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                  Context
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>User:</span>
                    <span className={`ml-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                      {result.context.user.name}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>Role:</span>
                    <span className={`ml-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                      {result.context.user.role}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>Time:</span>
                    <span className={`ml-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
                      {result.context.time.hour}:00
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>Resource:</span>
                    <span className={`ml-2 ${isDark ? 'text-[#F3F4F6]' : 'text-[#111827]'}`}>
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
  );
};

export default AccessTester;