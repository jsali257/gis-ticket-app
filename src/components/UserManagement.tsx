"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isAvailableForAssignment: boolean;
  createdAt: string;
};

const UserManagement = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    department: 'Other',
    isAvailableForAssignment: true
  });
  
  // Form state for editing user
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    isAvailableForAssignment: true
  });
  
  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Error fetching users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new user
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      // Reset form and refresh user list
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user',
        department: 'Other',
        isAvailableForAssignment: true
      });
      
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error creating user. Please try again.');
      console.error('Error creating user:', err);
    }
  };
  
  // Update user
  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      // Reset form and refresh user list
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error updating user. Please try again.');
      console.error('Error updating user:', err);
    }
  };
  
  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error deleting user. Please try again.');
      console.error('Error deleting user:', err);
    }
  };
  
  // Start editing a user
  const startEditing = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isAvailableForAssignment: user.isAvailableForAssignment
    });
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
  };
  
  // Handle input change for new user form
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setNewUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle input change for edit form
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError('')}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Create New User Form */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        <form onSubmit={createUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleNewUserChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                Role
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="role"
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="front_desk">Front Desk</option>
                <option value="gis_staff">GIS Staff</option>
                <option value="gis_verifier">GIS Verifier</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="department">
                Department
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="department"
                name="department"
                value={newUser.department}
                onChange={handleNewUserChange}
                required
              >
                <option value="Front Desk">Front Desk</option>
                <option value="GIS">GIS</option>
                <option value="Admin">Admin</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                className="mr-2 leading-tight"
                type="checkbox"
                id="isAvailableForAssignment"
                name="isAvailableForAssignment"
                checked={newUser.isAvailableForAssignment}
                onChange={handleNewUserChange}
              />
              <label className="text-gray-700 text-sm font-bold" htmlFor="isAvailableForAssignment">
                Available for Assignment
              </label>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
      
      {/* Edit User Form */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Edit User: {editingUser.name}</h2>
            <form onSubmit={updateUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-name">
                    Name
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="edit-name"
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-email">
                    Email
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="edit-email"
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-role">
                    Role
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="edit-role"
                    name="role"
                    value={editForm.role}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="front_desk">Front Desk</option>
                    <option value="gis_staff">GIS Staff</option>
                    <option value="gis_verifier">GIS Verifier</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-department">
                    Department
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="edit-department"
                    name="department"
                    value={editForm.department}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="Front Desk">Front Desk</option>
                    <option value="GIS">GIS</option>
                    <option value="Admin">Admin</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    className="mr-2 leading-tight"
                    type="checkbox"
                    id="edit-isAvailableForAssignment"
                    name="isAvailableForAssignment"
                    checked={editForm.isAvailableForAssignment}
                    onChange={handleEditFormChange}
                  />
                  <label className="text-gray-700 text-sm font-bold" htmlFor="edit-isAvailableForAssignment">
                    Available for Assignment
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* User List */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">User List</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="py-2 px-4 border-b border-gray-200">{user.name}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{user.email}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{user.role}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{user.department}</td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      {user.isAvailableForAssignment ? 'Yes' : 'No'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <button
                        className="text-blue-500 hover:text-blue-700 mr-2"
                        onClick={() => startEditing(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
