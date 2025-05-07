import { useState, FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { apiFetch } from "../api";

export default function Login(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error((await res.json()).error || res.statusText);

      const data = await res.json();
      const userId = data.user.UserID;
      const userRole = data.user.Role;

      switch (userRole) {
        case 1:
          navigate(`/admin/${userId}`);
          break;
        case 2:
          navigate(`/moderator/${userId}`);
          break;
        case 3:
          navigate(`/member/${userId}`);
          break;
        default:
          setError('Invalid role.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />

      <div
        className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-100 via-white to-blue-200"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1605902711622-cfb43c4437d2?auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-xl w-full max-w-md p-8">
          <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-6">Login to NutriSync</h2>

          {error && (
            <div className="mb-4 text-red-600 bg-red-100 border border-red-200 px-4 py-2 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 font-medium mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 font-medium mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don’t have an account?{' '}
            <a href="/signup" className="text-blue-600 hover:underline font-medium">Sign up here</a>
          </p>
        </div>
      </div>
    </>
  );
}
