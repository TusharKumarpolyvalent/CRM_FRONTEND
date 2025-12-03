import React, { useState } from 'react';
import axios from 'axios';
import { successToast } from '../helpers/Toast';
import { useGlobalContext } from '../context/GlobalContext';

const roles = ["agent", "admin"]

const AddUser = () => {
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const { setShowAddUserModal } = useGlobalContext();
  const [loading, setLoading] = useState(false);

  // Handle Input Change
  const handleChange = (e) => {
    console.log('Input changed:', e.target.name, e.target.value);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit User Data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/add-user`,
        form
      );

      successToast('User added successfully!');
      setForm({
        id: '',
        name: '',
        email: '',
        password: '',
        role: '',
      });
      setShowAddUserModal(false);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user! Check API server.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white shadow-xl p-8 rounded-2xl border border-gray-200">
        <div>
          <p
            className="text-right text-2xl cursor-pointer ml-20"
            onClick={() => setShowAddUserModal(false)}
          >
            ❌
          </p>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-center mb-2">Add User </h2>
          <p className="text-center text-gray-500 mb-6">
            Create a new user account
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* ID */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">User ID</label>
            <input
              type="text"
              name="id"
              value={form.id}
              onChange={handleChange}
              placeholder="Enter user ID"
              className="w-full bg-gray-100 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full bg-gray-100 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full bg-gray-100 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full bg-gray-100 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full bg-gray-100 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="" disabled selected>
                Select role
              </option>
              {
                roles.map(role => (
                 <option value={role} key={role}>{role.toUpperCase()}</option>

                ))
              }
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition text-lg font-medium cursor-pointer"
          >
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
