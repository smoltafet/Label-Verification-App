'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    keepSignedIn: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    // Convert username to email format for Firebase Auth
    const email = formData.username.includes('@') 
      ? formData.username 
      : `${formData.username}@ttb.gov`;

    setLoading(true);

    try {
      await login(email, formData.password);
      
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setError('Invalid username or password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/Logo.png"
              alt="TTB Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-semibold text-[#212529] mb-2">
            Sign in to your account
          </h1>
          <p className="text-sm text-[#6c757d]">
            TTB Label Verification Portal
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Username */}
              <div>
                <input
                  type="text"
                  placeholder="username@ttb.gov"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all text-base disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all text-base disabled:opacity-50"
                />
              </div>

              {/* Keep me signed in */}
              <div className="flex items-center">
                <input
                  id="keep-signed-in"
                  type="checkbox"
                  checked={formData.keepSignedIn}
                  onChange={(e) => setFormData({ ...formData, keepSignedIn: e.target.checked })}
                  disabled={loading}
                  className="h-4 w-4 text-[#003d7a] focus:ring-[#003d7a] border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="keep-signed-in" className="ml-2 block text-sm text-[#6c757d]">
                  Keep me signed in
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003d7a] text-white py-4 rounded-lg font-semibold text-base hover:bg-[#1e3a5f] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </div>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#6c757d]">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-[#003d7a] font-medium hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
