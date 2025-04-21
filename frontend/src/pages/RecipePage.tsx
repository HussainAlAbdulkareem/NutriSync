import { useState, useEffect, JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Recipe {
  RecipeID:      number;
  Title:         string;
  Description:   string;
  TimeStamp:     string;
  Serving_Size:  number;
  TotalCalories: number;
  ImageURL?:     string;
}
interface Ingredient { ingredientID: number; name: string; calories: number; unit: string; }
interface Category   { categoryID: number; name: string; }

export default function RecipeDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe]         = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const navigate = useNavigate();
   // Like handler
  const handleLike = async (): Promise<void> => {
    const res = await fetch(`/api/recipe/${id}/like`, { method: 'POST' });
    if (!res.ok) alert('Error liking recipe');
    else alert('Liked!');
  };

  // Track handler
  const handleTrack = async (): Promise<void> => {
    const res = await fetch(`/api/recipe/${id}/track`, { method: 'POST' });
    if (!res.ok) alert('Error tracking');
    else alert('Calories added to tracker!');
  };

  useEffect(() => {
    async function load() {
      try {
        const [rRes, iRes, cRes] = await Promise.all([
          fetch(`/api/recipes/${id}`),
          fetch(`/api/recipe/${id}/ingredients`),
          fetch(`/api/recipe/${id}/categories`)
        ]);
        if (!rRes.ok) throw new Error('Recipe not found');
        const rData: Recipe       = await rRes.json();
        const iData: Ingredient[] = await iRes.json();
        const cData: Category[]   = await cRes.json();
        setRecipe(rData);
        setIngredients(iData);
        setCategories(cData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className="text-center py-10 text-gray-600">Loading recipe…</p>;
  if (error) return <p className="text-red-500 text-center mt-6">{error}</p>;
  if (!recipe) return <p className="text-center py-10 text-gray-600">Recipe not found.</p>;

  return (
    <>
      {/* ✅ Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
        <div className="flex justify-start px-4 mt-4">
        <button
          onClick={() => navigate(`/member/${id}/search/`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          ← Back to Dashboard
        </button>
        </div>
      </nav>

      {/* ✅ Recipe Content */}
      <div className="min-h-screen bg-gray-50 px-6 py-10 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl border border-gray-200">
          {recipe.ImageURL && (
            <img src={recipe.ImageURL} alt={recipe.Title} className="w-full rounded-lg mb-6 object-cover max-h-64" />
          )}

          <h2 className="text-3xl font-bold text-gray-800 mb-2">{recipe.Title}</h2>
          <p className="text-sm text-gray-500 mb-4">{new Date(recipe.TimeStamp).toLocaleDateString()}</p>

          <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">🍴 Ingredients</h3>
          <ul className="list-disc ml-6 mb-4">
            {ingredients.map(i => (
              <li key={i.ingredientID}>
                {i.name} - {i.calories} cal [{i.unit}]
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">📋 Instructions</h3>
          <p className="text-gray-700 mb-6">{recipe.Description}</p>

          <p className="text-gray-800 mb-4">
            <strong>Total Calories:</strong> {recipe.TotalCalories} kcal
          </p>

          <p className="mb-6">
            <strong className="text-gray-700">Tags:</strong>{' '}
            {categories.map(c => (
              <span
                key={c.categoryID}
                className="inline-block bg-blue-100 text-blue-700 text-xs font-medium mr-2 px-3 py-1 rounded-full"
              >
                {c.name}
              </span>
            ))}
          </p>

          {/* ✅ Buttons */}
          <div className="flex gap-4">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow" onClick={handleLike}>
              ❤️ Like
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md shadow"onClick={handleTrack}>
              ➕ Add to Tracker
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
