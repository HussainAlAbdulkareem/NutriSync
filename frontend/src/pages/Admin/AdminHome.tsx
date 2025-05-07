import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from "../api";

const AdminHome: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<{ adminName: string; analytics: any } | null>(null);

  useEffect(() => {
    apiFetch(`/api/admin/${id}`)
      .then((res) => res.json())
      .then((data) => setAdminData(data))
      .catch((err) => console.error('Failed to apiFetch admin data', err));
  }, [id]);

  const handleLogout = async () => {
    await apiFetch('/api/logout', { method: 'POST' });
    navigate('/login');
  };

  if (!adminData) return <div className="text-center py-10 text-gray-600">Loading...</div>;
  if (adminData.adminName === 'None') return <div className="text-center text-red-500 mt-10">Admin not found</div>;

  return (
    <>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight">Admin</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md text-sm"
          >
            Logout
          </button>
        </div>
      </nav>


      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto border border-gray-200">
          {/* Greeting */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {adminData.adminName} 👋</h2>
          <p className="text-gray-600 mb-6">Here’s a summary of your platform activity.</p>

          {/* Analytics */}
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full table-auto border border-gray-200 rounded-md">
              <thead className="bg-blue-100 text-left">
                <tr>
                  <th className="px-4 py-2 border">Analytics</th>
                  <th className="px-4 py-2 border">Count</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="px-4 py-2 border">New Recipes (Last 30 Days)</td>
                  <td className="px-4 py-2 border">{adminData.analytics.recipes}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 border">Total Ingredients</td>
                  <td className="px-4 py-2 border">{adminData.analytics.ingredients}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 border">Total Categories</td>
                  <td className="px-4 py-2 border">{adminData.analytics.categories}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">Total Users</td>
                  <td className="px-4 py-2 border">{adminData.analytics.users}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to={`/admin/${id}/manage-moderator`}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-center font-medium shadow"
            >
              👩‍💼 View All Moderators
            </Link>
            <Link
              to={`/admin/${id}/manage-member`}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-md text-center font-medium shadow"
            >
              👤 View All Members
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminHome;
