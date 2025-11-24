import { useState, useEffect } from 'react';
import { 
  Edit2, Trash2, Check, X, AlertCircle, RefreshCw, Plus,
  User, Database, FileJson
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

interface User {
  id?: number;
  username: string;
  role: string;
  email?: string;
  department?: string;
  active?: number;
}

interface Resource {
  id?: number;
  name: string;
  type: string;
  path: string;
  description?: string;
  owner?: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  type: 'user' | 'resource';
  name: string;
  onConfirm: () => void;
}

export default function ManagementPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'users' | 'resources' | 'policies'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ username: '', role: '', email: '', department: '' });
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState({ name: '', type: 'database', path: '', description: '', owner: '' });
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState('');

  // Policies state
  const [policies, setPolicies] = useState<any>(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  // Confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    type: 'user',
    name: '',
    onConfirm: () => {}
  });

  const resourceTypes = ['database', 'api', 'file', 'service', 'other'];

  // Apply theme to document for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadResources();
    loadPolicies();
  }, []);

  // ============ USERS ============
  const loadUsers = async () => {
    try {
      setUserLoading(true);
      const result = await apiService.getUsersCRUD();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      setUserError('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.role) {
      setUserError('Username and role are required');
      return;
    }

    try {
      setUserLoading(true);
      setUserError('');

      let result;
      if (editingUser) {
        result = await apiService.updateUserCRUD(editingUser.username, userForm);
      } else {
        result = await apiService.createUserCRUD(
          userForm.username, 
          userForm.role, 
          userForm.email, 
          userForm.department
        );
      }

      if (result.success) {
        await loadUsers();
        resetUserForm();
      } else {
        setUserError(result.error || 'Failed to save user');
      }
    } catch (error) {
      setUserError('Error saving user');
      console.error('Error saving user:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'user',
      name: username,
      onConfirm: async () => {
        try {
          setUserLoading(true);
          const result = await apiService.deleteUserCRUD(username);

          if (result.success) {
            await loadUsers();
          } else {
            setUserError(result.error || 'Failed to delete user');
          }
        } catch (error) {
          setUserError('Error deleting user');
          console.error('Error deleting user:', error);
        } finally {
          setUserLoading(false);
          setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      role: user.role,
      email: user.email || '',
      department: user.department || '',
    });
    setShowUserForm(true);
  };

  const resetUserForm = () => {
    setUserForm({ username: '', role: '', email: '', department: '' });
    setEditingUser(null);
    setShowUserForm(false);
    setUserError('');
  };

  // ============ RESOURCES ============
  const loadResources = async () => {
    try {
      setResourceLoading(true);
      const result = await apiService.getResourcesCRUD();
      if (result.success) {
        setResources(result.data || []);
      }
    } catch (error) {
      setResourceError('Failed to load resources');
      console.error('Error loading resources:', error);
    } finally {
      setResourceLoading(false);
    }
  };

  const handleSaveResource = async () => {
    if (!resourceForm.name || !resourceForm.type || !resourceForm.path) {
      setResourceError('Name, type, and path are required');
      return;
    }

    try {
      setResourceLoading(true);
      setResourceError('');

      let result;
      if (editingResource) {
        result = await apiService.updateResourceCRUD(editingResource.name, resourceForm);
      } else {
        result = await apiService.createResourceCRUD(
          resourceForm.name,
          resourceForm.type,
          resourceForm.path,
          resourceForm.description,
          resourceForm.owner
        );
      }

      if (result.success) {
        await loadResources();
        resetResourceForm();
      } else {
        setResourceError(result.error || 'Failed to save resource');
      }
    } catch (error) {
      setResourceError('Error saving resource');
      console.error('Error saving resource:', error);
    } finally {
      setResourceLoading(false);
    }
  };

  const handleDeleteResource = async (name: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'resource',
      name: name,
      onConfirm: async () => {
        try {
          setResourceLoading(true);
          const result = await apiService.deleteResourceCRUD(name);

          if (result.success) {
            await loadResources();
          } else {
            setResourceError(result.error || 'Failed to delete resource');
          }
        } catch (error) {
          setResourceError('Error deleting resource');
          console.error('Error deleting resource:', error);
        } finally {
          setResourceLoading(false);
          setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      type: resource.type,
      path: resource.path,
      description: resource.description || '',
      owner: resource.owner || '',
    });
    setShowResourceForm(true);
  };

  const resetResourceForm = () => {
    setResourceForm({ name: '', type: 'database', path: '', description: '', owner: '' });
    setEditingResource(null);
    setShowResourceForm(false);
    setResourceError('');
  };

  // ============ POLICIES ============
  const loadPolicies = async () => {
    try {
      setPolicyLoading(true);
      const result = await apiService.getPoliciesCRUD();
      if (result.success) {
        setPolicies(result.data);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setPolicyLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-primary">
      {/* Header */}
      <div className="shrink-0 bg-secondary border-b border-primary px-6 py-4">
        <h2 className="text-2xl font-bold text-primary">System Management</h2>
        <p className="text-sm text-secondary mt-1">Manage users, resources, and policies</p>
      </div>

      {/* Tabs */}
      <div className="shrink-0 bg-tertiary border-b border-primary flex">
        {(['users', 'resources', 'policies'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-primary border-primary'
                : 'text-secondary border-transparent hover:text-primary'
            }`}
          >
            {tab === 'users' && <User size={18} />}
            {tab === 'resources' && <Database size={18} />}
            {tab === 'policies' && <FileJson size={18} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {(userLoading || resourceLoading || policyLoading) && (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="animate-spin text-primary" size={24} />
              <span className="ml-2 text-primary">Loading...</span>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Add User Button */}
              {!showUserForm && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowUserForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={16} />
                    Add New User
                  </button>
                </div>
              )}

              {/* Add/Edit User Form */}
              {showUserForm && (
                <div className="bg-card rounded-lg border border-primary p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">
                      {editingUser ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button
                      onClick={resetUserForm}
                      className="p-1 hover-bg rounded-lg text-secondary transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {userError && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive text-destructive text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {userError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Username</label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        disabled={!!editingUser}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted disabled:opacity-50"
                        placeholder="alice"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Role</label>
                      <input
                        type="text"
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted"
                        placeholder="Admin, Developer, Guest..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Email</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted"
                        placeholder="alice@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Department</label>
                      <input
                        type="text"
                        value={userForm.department}
                        onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted"
                        placeholder="IT, Engineering..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSaveUser}
                      disabled={userLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Check size={16} />
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                    <button
                      onClick={resetUserForm}
                      className="flex items-center gap-2 px-4 py-2 bg-tertiary text-primary rounded-lg hover-bg"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="bg-card rounded-lg border border-primary overflow-hidden">
                <div className="px-6 py-4 border-b border-primary flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary">Users ({users.length})</h3>
                  <button
                    onClick={loadUsers}
                    className="p-2 hover-bg rounded-lg text-secondary"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-tertiary border-b border-primary">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Username</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Department</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary">
                      {users.map((user) => (
                        <tr key={user.username} className="hover:bg-tertiary transition-colors">
                          <td className="px-6 py-4 font-medium text-primary">{user.username}</td>
                          <td className="px-6 py-4 text-secondary">{user.role}</td>
                          <td className="px-6 py-4 text-secondary">{user.email || '—'}</td>
                          <td className="px-6 py-4 text-secondary">{user.department || '—'}</td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 hover:bg-blue-900/30 text-primary rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.username)}
                              className="p-2 hover:bg-red-900/30 text-destructive rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              {/* Add Resource Button */}
              {!showResourceForm && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowResourceForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={16} />
                    Add New Resource
                  </button>
                </div>
              )}

              {/* Add/Edit Resource Form */}
              {showResourceForm && (
                <div className="bg-card rounded-lg border border-primary p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">
                      {editingResource ? 'Edit Resource' : 'Create New Resource'}
                    </h3>
                    <button
                      onClick={resetResourceForm}
                      className="p-1 hover-bg rounded-lg text-secondary transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {resourceError && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive text-destructive text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {resourceError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Name</label>
                      <input
                        type="text"
                        value={resourceForm.name}
                        onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                        disabled={!!editingResource}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted disabled:opacity-50"
                        placeholder="DB_Finance"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Type</label>
                      <select
                        value={resourceForm.type}
                        onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary"
                      >
                        {resourceTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Path</label>
                      <input
                        type="text"
                        value={resourceForm.path}
                        onChange={(e) => setResourceForm({ ...resourceForm, path: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted"
                        placeholder="/data/financial"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Owner</label>
                      <input
                        type="text"
                        value={resourceForm.owner}
                        onChange={(e) => setResourceForm({ ...resourceForm, owner: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted"
                        placeholder="alice"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary mb-2">Description</label>
                      <textarea
                        value={resourceForm.description}
                        onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-primary text-primary placeholder-muted resize-none"
                        rows={3}
                        placeholder="Resource description..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSaveResource}
                      disabled={resourceLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Check size={16} />
                      {editingResource ? 'Update Resource' : 'Create Resource'}
                    </button>
                    <button
                      onClick={resetResourceForm}
                      className="flex items-center gap-2 px-4 py-2 bg-tertiary text-primary rounded-lg hover-bg"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Resources List */}
              <div className="bg-card rounded-lg border border-primary overflow-hidden">
                <div className="px-6 py-4 border-b border-primary flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary">Resources ({resources.length})</h3>
                  <button
                    onClick={loadResources}
                    className="p-2 hover-bg rounded-lg text-secondary"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-tertiary border-b border-primary">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Path</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Owner</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary">
                      {resources.map((resource) => (
                        <tr key={resource.name} className="hover:bg-tertiary transition-colors">
                          <td className="px-6 py-4 font-medium text-primary">{resource.name}</td>
                          <td className="px-6 py-4 text-secondary">
                            <span className="px-2 py-1 rounded-full bg-blue-900/20 text-primary text-xs font-medium">
                              {resource.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-secondary font-mono text-sm">{resource.path}</td>
                          <td className="px-6 py-4 text-secondary">{resource.owner || '—'}</td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() => handleEditResource(resource)}
                              className="p-2 hover:bg-blue-900/30 text-primary rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteResource(resource.name)}
                              className="p-2 hover:bg-red-900/30 text-destructive rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* POLICIES TAB */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              {policies && (
                <div className="bg-card rounded-lg border border-primary p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Active Policy</h3>
                  {policies.active_policy ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-secondary">Name:</span>
                        <span className="font-medium text-primary">{policies.active_policy.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Version:</span>
                        <span className="font-medium text-primary">v{policies.active_policy.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Created:</span>
                        <span className="font-medium text-primary text-sm">
                          {new Date(policies.active_policy.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-4">
                        <span className="px-3 py-1 rounded-full bg-success/30 text-success text-sm font-medium">
                          ✓ Active
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary">No active policy. Compile SPL code to create one.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmation.onConfirm}
        title={`Delete ${deleteConfirmation.type}`}
        message={`Are you sure you want to delete ${deleteConfirmation.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        icon={deleteConfirmation.type === 'user' ? 'user' : 'database'}
        isLoading={userLoading || resourceLoading}
      />
    </div>
  );
}