import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Eye, Edit, UserCheck, UserX, 
  Shield, Users, Activity, Clock, Mail, Phone,
  Briefcase, Building, Calendar, Trash2, RefreshCw
} from 'lucide-react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'activities'

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, statusFilter, users]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes, rolesRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/users/stats/summary'),
        axios.get('/users/roles')
      ]);
      setUsers(usersRes.data);
      setFilteredUsers(usersRes.data);
      setStats(statsRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await axios.post('/users', userData);
      setUsers([response.data, ...users]);
      setShowUserModal(false);
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`/users/${id}/status`, { status });
      setUsers(users.map(u => u.id === id ? response.data : u));
      alert(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return '#dc2626';
      case 'manager': return '#f59e0b';
      case 'finance': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return Shield;
      case 'manager': return Briefcase;
      case 'finance': return Activity;
      default: return Users;
    }
  };

  if (loading) {
    return <div className="loading">Loading user data...</div>;
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0 }}>User Management</h2>
        <button 
          onClick={() => setShowUserModal(true)}
          style={{ background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <Users size={28} style={{ color: '#667eea', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Users</p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <UserCheck size={28} style={{ color: '#10b981', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.active}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Active Users</p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <UserX size={28} style={{ color: '#dc2626', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.inactive}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Inactive Users</p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <Activity size={28} style={{ color: '#f59e0b', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.active_sessions}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Active Sessions</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'users' ? '#667eea' : '#6b7280',
            borderBottom: activeTab === 'users' ? '2px solid #667eea' : 'none',
            fontWeight: activeTab === 'users' ? '600' : 'normal'
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'activities' ? '#667eea' : '#6b7280',
            borderBottom: activeTab === 'activities' ? '2px solid #667eea' : 'none',
            fontWeight: activeTab === 'activities' ? '600' : 'normal'
          }}
        >
          Activity Logs
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px' }}>
              <Search size={18} style={{ color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, marginLeft: '8px' }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="finance">Finance</option>
              <option value="staff">Staff</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Users Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredUsers.map(user => {
              const RoleIcon = getRoleIcon(user.role);
              const roleColor = getRoleBadgeColor(user.role);
              
              return (
                <div key={user.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          background: `${roleColor}20`, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <RoleIcon size={24} style={{ color: roleColor }} />
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{user.full_name}</h3>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{user.user_id}</span>
                        </div>
                      </div>
                      <span style={{ 
                        background: user.status === 'active' ? '#10b981' : '#dc2626',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Mail size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px' }}>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Phone size={14} style={{ color: '#6b7280' }} />
                          <span style={{ fontSize: '14px' }}>{user.phone}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Building size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px' }}>{user.department}</span>
                      </div>
                      {user.position && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Briefcase size={14} style={{ color: '#6b7280' }} />
                          <span style={{ fontSize: '14px' }}>{user.position}</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Role</span>
                        <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{user.role}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Last Login</span>
                        <div style={{ fontSize: '13px' }}>{user.last_login_formatted || 'Never'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedUser(user)}
                          style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          View
                        </button>
                        {user.status === 'active' ? (
                          <button 
                            onClick={() => handleUpdateStatus(user.id, 'inactive')}
                            style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateStatus(user.id, 'active')}
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activities' && stats && (
        <div>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.map((activity, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500' }}>{activity.user_name}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        background: '#e0e7ff', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {activity.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{activity.details}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                      {new Date(activity.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <UserModal 
          roles={roles}
          onClose={() => setShowUserModal(false)} 
          onSubmit={handleCreateUser}
        />
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

// User Modal for creating new users
function UserModal({ roles, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'staff',
    department: '',
    position: '',
    phone: '',
    mobile: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name) {
      alert('Please fill all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <h3>Add New User</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address *"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <input
            type="text"
            placeholder="Full Name *"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            {roles.map(role => (
              <option key={role.name} value={role.name}>{role.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Department"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <input
            type="text"
            placeholder="Position"
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create User</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// User Detail Modal
function UserDetailModal({ user, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [user.id]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`/users/${user.id}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = user.role === 'admin' ? Shield : user.role === 'manager' ? Briefcase : user.role === 'finance' ? Activity : Users;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>User Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '20px', background: '#f9fafb', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: '#667eea20', 
            borderRadius: '50%', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <RoleIcon size={40} style={{ color: '#667eea' }} />
          </div>
          <h2 style={{ margin: '0 0 4px 0' }}>{user.full_name}</h2>
          <span style={{ 
            background: user.status === 'active' ? '#10b981' : '#dc2626',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            display: 'inline-block'
          }}>
            {user.status}
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div><strong>User ID:</strong> {user.user_id}</div>
          <div><strong>Role:</strong> {user.role}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Department:</strong> {user.department}</div>
          {user.phone && <div><strong>Phone:</strong> {user.phone}</div>}
          {user.mobile && <div><strong>Mobile:</strong> {user.mobile}</div>}
          {user.position && <div><strong>Position:</strong> {user.position}</div>}
          <div><strong>Last Login:</strong> {user.last_login_formatted || 'Never'}</div>
        </div>
        
        <h4>Recent Activity ({activities.length})</h4>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {loading ? (
            <p>Loading activities...</p>
          ) : activities.length === 0 ? (
            <p>No activity found</p>
          ) : (
            activities.map(activity => (
              <div key={activity.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>{activity.action.replace('_', ' ')}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(activity.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{activity.details}</p>
              </div>
            ))
          )}
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;