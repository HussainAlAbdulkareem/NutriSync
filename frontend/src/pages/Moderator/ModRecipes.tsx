import { useState, useEffect, JSX } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from "../api";

interface Recipe {
  RecipeID: number;
  Title: string;
  Description: string;
}

export default function ModRecipes(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [moderatorName, setModeratorName] = useState<string>('Moderator');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchRecipes();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await apiFetch('/api/user');
      const data = await res.json();
      setModeratorName(data.UserName || 'Moderator');
    } catch {
      setModeratorName('Moderator');
    }
  };

  const fetchRecipes = async () => {
    try {
      const res = await apiFetch('/api/recipes/pending');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Recipe[] = await res.json();
      setRecipes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recipeId: number) => {
    try {
      const res = await apiFetch(`/api/recipe/${recipeId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({moderatorID : id}),
      });
      if (!res.ok) throw new Error('Approval failed');
      setRecipes(prev => prev.filter(r => r.RecipeID !== recipeId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (recipeId: number) => {
    try {
      const res = await apiFetch(`/api/recipe/${recipeId}/reject`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Rejection failed');
      setRecipes(prev => prev.filter(r => r.RecipeID !== recipeId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-center py-10 text-gray-600">Loading pending recipes…</p>;
  if (error) return <p className="text-red-500 text-center py-6">Error: {error}</p>;

  return (
    <>
      {/* ✅ Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">{moderatorName}</div>
      </nav>
      <div className="flex justify-start px-4 mt-4">
      <button
      onClick={() => navigate(`/moderator/${id}/`)}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
    >
      ← Back to Dashboard
    </button>
      </div>
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Recipes</h2>

          {recipes.length === 0 ? (
            <p className="text-gray-600 text-sm">No pending recipes for approval.</p>
          ) : (
            <div className="space-y-6">
              {recipes.map(recipe => (
                <div key={recipe.RecipeID} className="border border-gray-300 rounded-md p-4">
                  <h3 className="text-xl font-semibold text-gray-800">{recipe.Title}</h3>
                  <p className="text-gray-600 mt-1 mb-4">{recipe.Description}</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(recipe.RecipeID)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(recipe.RecipeID)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
