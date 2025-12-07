'use client';

import { useState, useEffect, FormEvent } from 'react';
import Header from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { useAuth } from '@/features/auth/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase';

export default function ProfilePage() {
  const { userProfile, user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load user profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        username: userProfile.username,
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppSidebar>
        <div className="flex flex-col min-h-screen">
          <Header />
          
          <main className="flex-1 py-12 px-6">
            <div className="w-full max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
                <h2 className="text-2xl font-semibold text-[#212529] mb-2">
                  Profile Settings
                </h2>
                <p className="text-sm text-[#6c757d] mb-8">
                  Manage your account information
                </p>
                
                {/* Success/Error Message */}
                {message.text && (
                  <div className={`mb-6 p-4 rounded-lg text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* Profile Form */}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* First Name */}
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-[#212529] mb-2">
                        First name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all disabled:opacity-50"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-[#212529] mb-2">
                        Last name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all disabled:opacity-50"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-[#212529] mb-2">
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-[#212529] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d7a] focus:bg-white transition-all disabled:opacity-50"
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#003d7a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e3a5f] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>

          <footer className="py-6 border-t border-gray-300 bg-[#003d7a] text-white mt-auto">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm">
                  © 2025 Alcohol and Tobacco Tax and Trade Bureau (TTB)
                </div>
                <div className="flex gap-6 text-sm">
                  <a href="#" className="hover:underline">Privacy Policy</a>
                  <a href="#" className="hover:underline">Terms of Service</a>
                  <a href="#" className="hover:underline">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </AppSidebar>
    </ProtectedRoute>
  );
}
