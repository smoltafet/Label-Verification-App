'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.agreedToTerms) {
      setError('Please agree to the Terms and Conditions');
      return;
    }

    // Convert username to email format for Firebase Auth
    const email = formData.username.includes('@') 
      ? formData.username 
      : `${formData.username}@ttb.gov`;

    setLoading(true);

    try {
      await signup(
        email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.username
      );
      
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This username is already taken');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
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
            Create your account
          </h1>
          <p className="text-sm text-[#6c757d]">
            Join the TTB Label Verification Portal
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all text-base disabled:opacity-50"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={loading}
                    className="w-full px-4 py-4 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all text-base disabled:opacity-50"
                  />
                </div>
              </div>

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

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all text-base disabled:opacity-50"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  disabled={loading}
                  className="h-4 w-4 text-[#003d7a] focus:ring-[#003d7a] border-gray-300 rounded mt-1 disabled:opacity-50"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-[#6c757d]">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#003d7a] hover:underline">
                    Terms and Conditions
                  </Link>
                </label>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003d7a] text-white py-4 rounded-lg font-semibold text-base hover:bg-[#1e3a5f] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </div>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#6c757d]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#003d7a] font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
