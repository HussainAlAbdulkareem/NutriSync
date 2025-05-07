import { useState, useEffect, ChangeEvent, FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { apiFetch } from "../api";

interface Category {
  categoryID: number;
  name: string;
  moderatorID: number;
}

export default function ModCategories(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', moderatorID: id });
  const [moderatorName, setModeratorName] = useState<string>('Moderator');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    loadCategories();
  }, []);

  async function fetchUser() {
    try {
      const res = await apiFetch('/api/user');
      const data = await res.json();
      setModeratorName(data.UserName || 'Moderator');
      setForm(prev => ({ ...prev, moderatorID: data.UserID }));
    } catch (err) {
      console.error('Failed to apiFetch moderator', err);
    }
  }

  async function loadCategories() {
    try {
      const res = await apiFetch('/api/categories');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Category[] = await res.json();
      setCategories(data);
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
      [name]: name === 'moderatorID' ? +value : value
    }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || res.statusText);
      }
      await loadCategories();
      setForm({ name: '', moderatorID: form.moderatorID });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await apiFetch(`/api/category/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setCategories(prev => prev.filter(c => c.categoryID !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <p className="text-center py-10 text-gray-600">Loading categories...</p>;
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
          {/* 📦 Category List */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Categories</h2>

          <ul className="mb-8 space-y-4">
            {categories.map(c => (
              <li
                key={c.categoryID}
                className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md"
              >
                <div className="font-medium">{c.name}</div>
                <button
                  onClick={() => handleDelete(c.categoryID)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-md"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {/* ➕ Add Category */}
          <form onSubmit={handleAdd} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Category</h3>
            <input
              name="name"
              placeholder="Category Name"
              value={form.name}
              onChange={handleChange}
              required
              className="border rounded-md px-4 py-2 w-full"
            />
            <input
              name="moderatorID"
              type="number"
              value={form.moderatorID}
              hidden
              readOnly
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Add Category
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
