import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from "../api";

interface Recipe {
  id: string;
  name: string;
  calories: number;
}

const MemberTracker: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    fetchRecipes();
    fetchUserCalories();
  }, [id]);

  const fetchRecipes = async () => {
    try {
      const res = await apiFetch(`/api/member/${id}/tracker/recipe`);
      const data = await res.json();
      if (data[0] != null){
        setRecipes(data);
      }
    } catch (err) {
      alert('Failed to apiFetch recipes');
    }
  };

  const fetchUserCalories = async () => {
    try {
      const res = await apiFetch(`/api/member/${id}/calorie`);
      const data = await res.json();
      setTotalCalories(data[0]);
    } catch (err) {
      alert('Failed to apiFetch user calories');
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    const confirmed = window.confirm("Are you sure you want to remove this recipe?");
    if (!confirmed) return;

    try {
      await apiFetch(`/api/member/${id}/tracker/delete/${recipeId}`, {
        method: 'DELETE',
      });
      await fetchRecipes();
      await fetchUserCalories();
    } catch (err) {
      alert('Failed to remove recipe');
    }
  };

  return (
    <>
      <nav className="flex items-center justify-start px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
      </nav>
      <div className="flex justify-start px-4 mt-4">
        <button
          onClick={() => navigate(`/member/${id}`)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          ← Back to Home
        </button>
      </div>
      <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Recipe Tracker</h2>
          <p className="text-gray-600 mb-6">Total Calories Consumed: <span className="font-semibold text-blue-700">{totalCalories}</span></p>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-200 rounded-md">
              <thead className="bg-blue-100 text-left">
                <tr>
                  <th className="px-4 py-2 border">Recipe</th>
                  <th className="px-4 py-2 border">Calories</th>
                  <th className="px-4 py-2 border">Modification</th>
                </tr>
              </thead>
              <tbody>
                {recipes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-500">No recipes tracked yet.</td>
                  </tr>
                ) : (
                  recipes.map((recipe) => (
                    <tr key={recipe.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2 border">{recipe.name}</td>
                      <td className="px-4 py-2 border">{recipe.calories}</td>
                      <td className="px-4 py-2 border">
                        <button
                          onClick={() => handleRemoveRecipe(recipe.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberTracker;
