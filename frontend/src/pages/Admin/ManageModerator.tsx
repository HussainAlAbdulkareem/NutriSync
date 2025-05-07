import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from "../api";

const ManageModerator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moderators, setModerators] = useState<any[]>([]);
  const [selectedUserIDs, setSelectedUserIDs] = useState<string[]>([]);
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchModerator = async () => {
    try {
      const res = await apiFetch(`/api/admin/${id}/manage-moderator/`);
      const data = await res.json();
      if (data[0] != null) {
        setModerators(data);
      }
    } catch (err) {
      showBanner('Failed to apiFetch moderators', 'error');
    }
  };

  const showBanner = (message: string, type: 'success' | 'error') => {
    setBanner({ message, type });
    setTimeout(() => setBanner(null), 3000);
  };

  useEffect(() => {
    fetchModerator();
  }, []);

  const handleSelect = (userID: string) => {
    setSelectedUserIDs((prevSelected) =>
      prevSelected.includes(userID)
        ? prevSelected.filter((id) => id !== userID)
        : [...prevSelected, userID]
    );
  };

  const handleBulkAction = async (action: 'blacklist' | 'unassign') => {
    try {
      const res = await apiFetch(`/api/admin/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: selectedUserIDs }),
      });

      if (!res.ok) throw new Error('Action failed');
      showBanner(`${action} action successful`, 'success');
    } catch {
      showBanner(`Failed to ${action} users`, 'error');
    }

    fetchModerator();
    setSelectedUserIDs([]);
  };

  return (
    <>
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700">NutriSync</div>
        <div className="text-2xl font-extrabold text-blue-700">Admin</div>
      </nav>

      <div className="flex justify-start px-4 mt-4">
        <button
          onClick={() => navigate(`/admin/${id}`)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          ← Back to Home
        </button>
      </div>

      {banner && (
        <div
          className={`mx-8 my-4 p-4 rounded-md text-white font-medium shadow-lg transition ${
            banner.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {banner.message}
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Manage Moderators
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-md">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left border">Select</th>
                  <th className="px-4 py-2 text-left border">User ID</th>
                  <th className="px-4 py-2 text-left border">Name</th>
                  <th className="px-4 py-2 text-left border">Email</th>
                </tr>
              </thead>
              <tbody>
                {moderators.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No Moderators Found.
                    </td>
                  </tr>
                ) : (
                  moderators.map((moderator) => (
                    <tr key={moderator.userID} className="hover:bg-blue-50 transition">
                      <td className="px-4 py-2 border text-center">
                        <input
                          type="checkbox"
                          className="accent-blue-600 w-4 h-4"
                          checked={selectedUserIDs.includes(moderator.userID)}
                          onChange={() => handleSelect(moderator.userID)}
                        />
                      </td>
                      <td className="px-4 py-2 border">{moderator.userID}</td>
                      <td className="px-4 py-2 border">{moderator.name}</td>
                      <td className="px-4 py-2 border">{moderator.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-end">
            <button
              onClick={() => handleBulkAction('unassign')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-md disabled:opacity-50 transition"
              disabled={selectedUserIDs.length === 0}
            >
              Assign as Members
            </button>
            <button
              onClick={() => handleBulkAction('blacklist')}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md disabled:opacity-50 transition"
              disabled={selectedUserIDs.length === 0}
            >
              Ban Selected Moderators
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageModerator;
