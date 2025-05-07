import { useState, useEffect, ChangeEvent, JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from "../api";

interface Category { categoryID: number; name: string; }
interface Ingredient { ingredientID: number; name: string; }
interface RecipeCard { RecipeID: number; Title: string; Description: string; ImageURL?: string; }

export default function SearchRecipes(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedIngredient, setSelectedIngredient] = useState<number | ''>('');
  const [recipes, setRecipes] = useState<RecipeCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [catsRes, ingRes, recRes] = await Promise.all([
        apiFetch('/api/categories'),
        apiFetch('/api/ingredients'),
        apiFetch('/api/recipes/search')
      ]);
      const [cats, ings, recs] = await Promise.all([catsRes.json(), ingRes.json(), recRes.json()]);
      setCategories(cats);
      setIngredients(ings);
      setRecipes(recs);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (selectedIngredient) params.append('ingredient_id', selectedIngredient.toString());
      const res = await apiFetch('/api/recipes/search?' + params.toString());
      const data = await res.json();
      setRecipes(data);
    })();
  }, [selectedCategory, selectedIngredient]);

  if (loading) return <p className="text-center py-10 text-gray-600">Loading recipes...</p>;

  return (
    <>
      {/* ✅ Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
        <div className="text-blue-700 font-semibold text-lg">Member</div>
      </nav>
      <div className="flex justify-start px-4 mt-4">
        <button
          onClick={() => navigate(`/member/${id}`)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          ← Back to Home
        </button>
      </div>
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {/* 🧭 Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">🔍 Browse Recipes</h2>
            <p className="text-gray-600">Filter by ingredient or category to find what you're craving!</p>
          </div>

          {/* 🔘 Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <select
              value={selectedCategory}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedCategory(e.target.value ? +e.target.value : '')
              }
              className="px-4 py-2 border rounded-md bg-white shadow-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.categoryID} value={c.categoryID}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedIngredient}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedIngredient(e.target.value ? +e.target.value : '')
              }
              className="px-4 py-2 border rounded-md bg-white shadow-sm"
            >
              <option value="">All Ingredients</option>
              {ingredients.map((i) => (
                <option key={i.ingredientID} value={i.ingredientID}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          {/* 📋 Recipe Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recipes.map((r) => (
              <div key={r.RecipeID} className="bg-white shadow-md rounded-lg overflow-hidden border">
                {r.ImageURL && (
                  <img
                    src={r.ImageURL}
                    alt={r.Title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{r.Title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{r.Description}</p>
                  <a
                    href={`/member/${id}/search/recipes/${r.RecipeID}`}
                    className="inline-block text-blue-600 hover:underline font-medium text-sm"
                  >
                    View Recipe →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
