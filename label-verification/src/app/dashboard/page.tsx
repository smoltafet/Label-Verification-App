'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import VerificationForm from '@/features/verification/VerificationForm';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LisaAssistant } from '@/features/verification/LisaAssistant';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [isLisaOpen, setIsLisaOpen] = useState(false);

  return (
    <ProtectedRoute>
      <AppSidebar>
      <div className="flex flex-col min-h-screen relative">
        <Header />
        
        <main className="flex-1 py-12 px-6">
          <VerificationForm />
        </main>

        <footer className="py-6 border-t border-gray-300 bg-[#003d7a] text-white mt-auto">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
              <p className="text-sm text-blue-100">
                Alcohol and Tobacco Tax and Trade Bureau (TTB) Label Verification System
              </p>
              <div className="flex items-center space-x-6">
                <a
                  href="https://www.ttb.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-100 hover:text-white transition-colors"
                >
                  TTB.gov
                </a>
                <a
                  href="https://www.ttb.gov/labeling"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-100 hover:text-white transition-colors"
                >
                  Labeling Guidelines
                </a>
                <a
                  href="https://www.ttb.gov/contact-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-100 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Lisa AI Assistant Button */}
        <button
          onClick={() => setIsLisaOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-30"
          aria-label="Open Lisa AI Assistant"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>

        {/* Lisa Assistant Panel */}
        <LisaAssistant 
          isOpen={isLisaOpen}
          onClose={() => setIsLisaOpen(false)}
        />
        </div>
      </AppSidebar>
    </ProtectedRoute>
  );
}
