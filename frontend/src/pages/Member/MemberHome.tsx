import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from "../api";

const MemberHome: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userCalories, setUserCalories] = useState<number>(0);
  const [member, setMember] = useState<{ Name: string; recipe: number } | null>(null);

  const fetchUserCalories = async () => {
    try {
      const res = await apiFetch(`/api/member/${id}/calorie`);
      const data = await res.json();
      setUserCalories(data[0]);
    } catch {
      alert('Failed to fetch user calories');
    }
  };

  const fetchMember = async () => {
    try {
      const res = await apiFetch(`/api/member/${id}`);
      const data = await res.json();
      setMember(data);
      console.log("👤 Member API:", data);
    } catch {
      alert('Failed to fetch member');
    }
  };

  useEffect(() => {
    fetchUserCalories();
    fetchMember();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    navigate('/login');
  };
  if (member === null) return <div className="text-center py-10 text-gray-600">Loading...</div>;

  return (
    <>
      {/* Simple Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
  <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
  <div className="flex items-center gap-4">
    
    <span className="text-2xl font-extrabold text-blue-700 tracking-tight">Member</span>
    <Link
      to={`/member/${id}/profile`}
      title="View Profile"
      className="w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-sm transition duration-200"
    >
      👤
    </Link>

    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md text-sm"
    >
      Logout
    </button>
  </div>
</nav>



      <div className="min-h-screen bg-gray-50 px-6 py-10">
        {/* Welcome card */}
        <div className="bg-white p-6 rounded-xl shadow-md text-center mb-10 border border-gray-200">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Welcome, {member.Name} 👋</h1>
          <p className="text-gray-600">Here’s your recipe activity overview.</p>
        </div>

        {/* Analytics Table */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Your Analytics</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-semibold text-gray-500 border-b">
                <th className="py-2">Metric</th>
                <th className="py-2">Value</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b">
                <td className="py-2">Recipes Added</td>
                <td className="py-2">{member.recipe}</td>
              </tr>
              <tr>
                <td className="py-2">Total Calories Tracked</td>
                <td className="py-2">{userCalories}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to={`/member/${id}/search/`}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-center font-medium shadow"
          >
            🔍 Search Recipes
          </Link>
          <Link
            to={`/member/${id}/create/`}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-center font-medium shadow"
          >
            ✍️ Create Recipe
          </Link>
          <Link
            to={`/member/${id}/tracker/`}
            className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-center font-medium shadow"
          >
            📈 Personal Tracker
          </Link>
        </div>
      </div>
    </>
  );
};

export default MemberHome;
