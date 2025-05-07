import { useState, FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { apiFetch } from "../api";

export default function Signup(): JSX.Element {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [phoneNo, setPhoneNo]   = useState('');
  const [error, setError]       = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone_no: phoneNo })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || res.statusText);
      }
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />

      <div
        className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-gray-100 relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1605902711622-cfb43c4437d2?auto=format&fit=crop&w=1920&q=80')",
        }}
      >

        <div className="relative z-10 bg-white bg-opacity-90 backdrop-blur-md shadow-lg rounded-lg max-w-md w-full p-8">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Sign Up</h2>

          {error && (
            <div className="mb-4 text-red-600 text-sm text-center bg-red-100 p-2 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNo}
              onChange={e => setPhoneNo(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Sign Up
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">Login here</a>
          </p>
        </div>
      </div>
    </>
  );
}
