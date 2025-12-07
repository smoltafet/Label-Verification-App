'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Step {
  image: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    image: '/step1.png',
    title: 'Step 1',
    description: 'Fill out the form with the appropriate information about your alcohol beverage product.',
  },
  {
    image: '/step2.png',
    title: 'Step 2',
    description: 'Take a clear photo of the label of the alcohol beverage. Make sure all text is visible and legible.',
  },
  {
    image: '/step3.png',
    title: 'Step 3',
    description: 'Upload the image to the form. Our AI will automatically extract and verify the text from your label.',
  },
  {
    image: '/step4.png',
    title: 'Step 4',
    description: 'Wait for approval. You\'ll receive instant verification results and can view your submission history.',
  },
];

interface OnboardingCarouselProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingCarousel({ isOpen, onClose }: OnboardingCarouselProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  // Reset to first step when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 bg-white hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>

              {/* Content - Side by Side Layout */}
              <div className="flex items-center min-h-[400px]">
                {/* Left Side - Image */}
                <div className="relative w-1/2 h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={currentStep}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: 'spring', stiffness: 700, damping: 40 },
                        opacity: { duration: 0.05 },
                      }}
                      className="absolute inset-0 flex items-center justify-center p-6"
                    >
                      <img
                        src={steps[currentStep].image}
                        alt={steps[currentStep].title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right Side - Text Content */}
                <div className="relative w-1/2 p-8">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={`text-${currentStep}`}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: 'spring', stiffness: 700, damping: 40 },
                        opacity: { duration: 0.05 },
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <h2 className="text-3xl font-bold text-[#003d7a] mb-3">
                          {steps[currentStep].title}
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                          {steps[currentStep].description}
                        </p>
                      </div>

                      {/* Step Indicators */}
                      <div className="flex gap-2 pt-4">
                        {steps.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setDirection(index > currentStep ? 1 : -1);
                              setCurrentStep(index);
                            }}
                            className={`h-1.5 rounded-full transition-all ${
                              index === currentStep
                                ? 'w-8 bg-[#003d7a]'
                                : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to step ${index + 1}`}
                          />
                        ))}
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-between pt-4">
                        <button
                          onClick={handlePrevious}
                          disabled={currentStep === 0}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700 font-medium"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>

                        {currentStep === steps.length - 1 ? (
                          <button
                            onClick={onClose}
                            className="px-5 py-2 bg-[#003d7a] text-white text-sm rounded-lg hover:bg-[#1e3a5f] transition-colors font-medium"
                          >
                            Get Started
                          </button>
                        ) : (
                          <button
                            onClick={handleNext}
                            className="flex items-center gap-1 px-5 py-2 bg-[#003d7a] text-white text-sm rounded-lg hover:bg-[#1e3a5f] transition-colors font-medium"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
