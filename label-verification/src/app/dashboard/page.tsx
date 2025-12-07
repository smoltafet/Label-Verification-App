'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import VerificationForm from '@/features/verification/VerificationForm';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LisaAssistant } from '@/features/verification/LisaAssistant';
import { OnboardingCarousel } from '@/components/shared/OnboardingCarousel';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [isLisaOpen, setIsLisaOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Show onboarding on first visit
  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding-seen-${user.uid}`);
      if (!hasSeenOnboarding) {
        setIsOnboardingOpen(true);
      }
    }
  }, [user]);

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    if (user) {
      localStorage.setItem(`onboarding-seen-${user.uid}`, 'true');
    }
  };

  return (
    <ProtectedRoute>
      <AppSidebar>
      <div className="flex flex-col min-h-screen relative">
        <Header />
        
        <main className="flex-1 py-12 px-6">
          {/* How It Works Button */}
          <div className="max-w-7xl mx-auto mb-6">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#003d7a] text-[#003d7a] rounded-lg hover:bg-[#003d7a] hover:text-white transition-all duration-300 shadow-sm font-medium"
            >
              <HelpCircle className="h-5 w-5" />
              How It Works
            </button>
          </div>

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
          className="fixed bottom-8 right-8 w-32 h-32 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 z-40 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-white flex items-center justify-center"
          aria-label="Open Lisa AI Assistant"
          title="Ask Lisa - AI Assistant"
        >
          <img
            src="/lisa.png"
            alt="Lisa AI Assistant"
            className="w-full h-full object-cover"
          />
        </button>

        {/* Lisa Assistant Panel */}
        <LisaAssistant 
          isOpen={isLisaOpen}
          onClose={() => setIsLisaOpen(false)}
        />

        {/* Onboarding Carousel */}
        <OnboardingCarousel
          isOpen={isOnboardingOpen}
          onClose={handleCloseOnboarding}
        />
        </div>
      </AppSidebar>
    </ProtectedRoute>
  );
}
