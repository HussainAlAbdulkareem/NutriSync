import { useState, useEffect, ChangeEvent, FormEvent, JSX } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from "../api";

interface Ingredient {
  ingredientID: number;
  name: string;
  calories: number;
  unit: string;
  moderatorID: number;
}

export default function ModIngredients(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [form, setForm] = useState({ name: '', calories: 0, unit: '', moderatorID: id });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moderatorName, setModeratorName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    loadIngredients();
  }, []);

  async function fetchUser() {
    try {
      const res = await apiFetch('/api/user');
      const data = await res.json();
      setModeratorName(data.UserName || 'Moderator');
    } catch (err) {
      console.error('Failed to apiFetch user', err);
    }
  }

  async function loadIngredients() {
    try {
      const res = await apiFetch('/api/ingredients');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Ingredient[] = await res.json();
      setIngredients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'calories' || name === 'moderatorID' ? +value : value
    }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || res.statusText);
      }
      await loadIngredients();
      setForm({ name: '', calories: 0, unit: '', moderatorID: form.moderatorID });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await apiFetch(`/api/ingredient/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setIngredients(prev => prev.filter(i => i.ingredientID !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-center py-10 text-gray-600">Loading ingredients...</p>;
  if (error) return <p className="text-red-500 text-center py-6">Error: {error}</p>;

  return (
    <>
      {/* ✅ Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">{moderatorName}</div>
      </nav>

      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto border border-gray-200">
          {/* 🧂 Ingredient List */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Ingredients</h2>

          <ul className="mb-8 space-y-4">
            {ingredients.map(i => (
              <li
                key={i.ingredientID}
                className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md"
              >
                <div>
                  <span className="font-semibold">{i.name}</span> — {i.calories} cal
                  <span className="ml-2 text-gray-500 text-sm italic">({i.unit})</span>
                </div>
                <button
                  onClick={() => handleDelete(i.ingredientID)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-md"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {/* ➕ Add Form */}
          <form onSubmit={handleAdd} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Ingredient</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Ingredient Name"
                value={form.name}
                onChange={handleChange}
                required
                className="border rounded-md px-4 py-2 w-full"
              />
              <input
                name="calories"
                type="number"
                placeholder="Calories"
                value={form.calories}
                onChange={handleChange}
                required
                className="border rounded-md px-4 py-2 w-full"
              />
              <input
                name="unit"
                placeholder="Unit (e.g., grams)"
                value={form.unit}
                onChange={handleChange}
                className="border rounded-md px-4 py-2 w-full"
              />
              <input
                name="moderatorID"
                type="number"
                value={form.moderatorID}
                onChange={handleChange}
                hidden
                readOnly
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Add Ingredient
            </button>
          </form>

          {/* 🔙 Back to Dashboard */}
          <div className="mt-10">
            <button
              onClick={() => navigate(`/moderator/${id}`)}
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
