// src/components/UserManagement.js
import React, { useState, useEffect } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setMessage('Failed to fetch users');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      setMessage('Email and password are required');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('User created successfully!');
        setMessageType('success');
        setShowAddModal(false);
        setNewUser({ email: '', name: '', password: '' });
        fetchUsers(); // Refresh the list
      } else {
        setMessage(data.error || 'Failed to create user');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      const updateData = { name: selectedUser.name };
      if (selectedUser.password) {
        updateData.password = selectedUser.password;
      }

      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('User updated successfully!');
        setMessageType('success');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
      } else {
        setMessage(data.error || 'Failed to update user');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to delete user: ${email}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${email}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('User deleted successfully!');
        setMessageType('success');
        fetchUsers(); // Refresh the list
      } else {
        setMessage(data.error || 'Failed to delete user');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser({ ...user, password: '' }); // Don't pre-fill password
    setShowEditModal(true);
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? '#dc3545' : '#007bff';
  };

  const getRoleIcon = (role) => {
    return role === 'admin' ? '👨‍💼' : '👤';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading users...</div>
      </div>
    );
  }

  // Filter users to show only non-admin users for management
  const regularUsers = users.filter(user => user.role !== 'admin');
  const adminUsers = users.filter(user => user.role === 'admin');

  return (
    <div className="user-management" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#011b37', marginBottom: '10px' }}>👥 User Management</h2>
        <p style={{ color: '#6c757d' }}>Manage registered users (Admin users cannot be modified)</p>
      </div>

      {message && (
        <div style={{
          backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
          color: messageType === 'success' ? '#155724' : '#721c24',
          padding: '15px',
          borderRadius: '5px',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {message}
          <button onClick={clearMessage} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{
          backgroundColor: '#e7f3ff',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #b3d7ff'
        }}>
          <h3 style={{ margin: '0', color: '#0066cc' }}>Total Users</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0066cc' }}>{users.length}</div>
        </div>
        
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ margin: '0', color: '#856404' }}>Regular Users</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404' }}>{regularUsers.length}</div>
        </div>
        
        <div style={{
          backgroundColor: '#f8d7da',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #f5c6cb'
        }}>
          <h3 style={{ margin: '0', color: '#721c24' }}>Admin Users</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#721c24' }}>{adminUsers.length}</div>
        </div>
      </div>

      {/* Add User Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Add New User
        </button>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderBottom: '1px solid #e9ecef',
          fontWeight: 'bold',
          display: 'grid',
          gridTemplateColumns: '40px 1fr 1fr 100px 150px 200px',
          gap: '15px',
          alignItems: 'center'
        }}>
          <span>Role</span>
          <span>Name</span>
          <span>Email</span>
          <span>Account Type</span>
          <span>Registration Date</span>
          <span>Actions</span>
        </div>

        {users.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
            No users found
          </div>
        ) : (
          users.map((user, index) => (
            <div
              key={user.email}
              style={{
                padding: '15px',
                borderBottom: index < users.length - 1 ? '1px solid #e9ecef' : 'none',
                display: 'grid',
                gridTemplateColumns: '40px 1fr 1fr 100px 150px 200px',
                gap: '15px',
                alignItems: 'center',
                backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
              }}
            >
              <span style={{ fontSize: '20px' }}>
                {getRoleIcon(user.role)}
              </span>
              <span style={{ fontWeight: '500' }}>
                {user.name || 'No name provided'}
              </span>
              <span style={{ color: '#6c757d' }}>
                {user.email}
              </span>
              <span
                style={{
                  color: getRoleColor(user.role),
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}
              >
                {user.role}
              </span>
              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                {formatDate(user.created_at)}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {user.role !== 'admin' && (
                  <>
                    <button
                      onClick={() => openEditModal(user)}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.email)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
                {user.role === 'admin' && (
                  <span style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                    Protected
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ email: '', name: '', password: '' });
                  }}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit User: {selectedUser.email}</h3>
            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password (leave blank to keep current):</label>
                <input
                  type="password"
                  value={selectedUser.password}
                  onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>ℹ️ User Management Guidelines</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li><strong>Add Users:</strong> Create new regular user accounts with email and password</li>
          <li><strong>Edit Users:</strong> Update user names and reset passwords for regular users</li>
          <li><strong>Delete Users:</strong> Remove regular user accounts (admin accounts are protected)</li>
          <li><strong>Admin Protection:</strong> Admin users cannot be modified or deleted by other admins</li>
          <li><strong>Security:</strong> All passwords are encrypted and stored securely</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;
