import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, updateUserRoles } from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    roles: []
  });

  const allRoles = ['admin', 'data_visualizator', 'translator_master', 'translator', 'training_expert'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Error loading users');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowCreateModal(false);
      setFormData({ email: '', password: '', name: '', roles: [] });
      loadUsers();
    } catch (err) {
      alert('Error creating user');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this user?')) {
      try {
        await deleteUser(id);
        loadUsers();
      } catch (err) {
        alert('Error deleting user');
      }
    }
  };

  const handleUpdateRoles = async (id, roles) => {
    try {
      await updateUserRoles(id, roles);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      alert('Error updating roles');
    }
  };

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-milo-red text-white rounded hover:bg-milo-dark"
        >
          Create user
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4">
                  {editingUser === user._id ? (
                    <div className="flex flex-wrap gap-2">
                      {allRoles.map(role => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={user.roles.includes(role)}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...user.roles, role]
                                : user.roles.filter(r => r !== role);
                              setUsers(users.map(u => 
                                u._id === user._id ? { ...u, roles: newRoles } : u
                              ));
                            }}
                            className="mr-1"
                          />
                          <span className="text-sm">{role}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <span key={role} className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user._id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateRoles(user._id, user.roles)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(null);
                          loadUsers();
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingUser(user._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit roles
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create user</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-milo-red focus:border-milo-red"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-milo-red focus:border-milo-red"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-milo-red focus:border-milo-red"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roles
                </label>
                <div className="space-y-2">
                  {allRoles.map(role => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="mr-2"
                      />
                      <span className="text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ email: '', password: '', name: '', roles: [] });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-milo-red hover:bg-milo-dark rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;