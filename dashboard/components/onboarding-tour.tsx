/**
 * Onboarding Tour Component
 * Guides new users through the key features of the Atheon Benchmark dashboard
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Home, BarChart3, Activity, CheckCircle } from 'lucide-react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Atheon Benchmark',
    description: 'A comprehensive AI benchmark system that compares Claude performance with and without Atheon MCP integration. Start your journey to understand how Atheon improves AI responses.',
    icon: <Home className="w-6 h-6" />,
    action: { label: 'Start Benchmark', href: '/benchmark' }
  },
  {
    id: 'benchmark',
    title: 'Run Your First Benchmark',
    description: 'Execute standardized tests that measure AI response quality, pattern matching accuracy, and performance. Select from various test categories and configurations.',
    icon: <BarChart3 className="w-6 h-6" />,
    action: { label: 'Run Benchmark', href: '/benchmark' }
  },
  {
    id: 'results',
    title: 'Analyze Results',
    description: 'View detailed benchmark results with performance metrics, token usage, and quality scores. Compare different systems and configurations side-by-side.',
    icon: <Activity className="w-6 h-6" />,
    action: { label: 'View Results', href: '/results' }
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description: 'You now have all the tools to start benchmarking. Contribute to the community by running benchmarks and sharing your results. Together we can measure the real impact of Atheon MCP.',
    icon: <CheckCircle className="w-6 h-6" />
  }
];

const ONBOARDING_STORAGE_KEY = 'atheon-benchmark-onboarding-complete';

interface OnboardingTourProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingTour({ isOpen = true, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const skipOnboarding = useCallback(() => {
    setDismissed(true);
    onClose?.();
  }, [onClose]);

  const focusTrapRef = useFocusTrap({
    isActive: isOpen && !dismissed,
    onEscape: skipOnboarding,
  });

  useEffect(() => {
    // Check if onboarding was already completed
    const wasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (wasCompleted === 'true') {
      setDismissed(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setCompleted(true);
    setDismissed(true);
    onClose?.();
  };

  const goToNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (dismissed || !isOpen) {
    return null;
  }

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div ref={focusTrapRef} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 to-purple-600">
          <button
            onClick={skipOnboarding}
            className="absolute top-4 right-4 p-1 text-white/80 hover:text-white transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl text-white">
              {step.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </p>
              <h2 className="text-xl font-bold text-white">{step.title}</h2>
            </div>
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {step.description}
          </p>

          {/* Action button for last step */}
          {step.action && isLastStep && (
            <a
              href={step.action.href}
              className="mt-6 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {step.action.label}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            {/* Dots */}
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-blue-600'
                      : index < currentStep
                      ? 'bg-blue-600'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={goToPrevious}
                  className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={goToNext}
                className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                aria-label={isLastStep ? 'Finish onboarding' : 'Next step'}
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage onboarding tour state
 */
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (completed !== 'true') {
      // Check if user has visited before (session storage)
      const hasVisited = sessionStorage.getItem('atheon-benchmark-visited');
      if (!hasVisited) {
        setIsFirstVisit(true);
        setShowTour(true);
        sessionStorage.setItem('atheon-benchmark-visited', 'true');
      }
    }
  }, []);

  const resetTour = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setShowTour(true);
  };

  const dismissTour = () => {
    setShowTour(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  };

  return {
    showTour,
    isFirstVisit,
    resetTour,
    dismissTour,
    OnboardingTour: isFirstVisit || showTour ? OnboardingTour : null
  };
}
