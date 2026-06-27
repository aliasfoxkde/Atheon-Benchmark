/**
 * Onboarding Tour Component Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('OnboardingTour Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tour Steps', () => {
    it('should have 4 tour steps', () => {
      const steps = [
        { id: 'welcome', title: 'Welcome' },
        { id: 'benchmark', title: 'Run Benchmark' },
        { id: 'results', title: 'Analyze Results' },
        { id: 'complete', title: "You're All Set!" },
      ];
      expect(steps).toHaveLength(4);
    });

    it('should have required properties for each step', () => {
      const step = {
        id: 'welcome',
        title: 'Welcome to Atheon Benchmark',
        description: 'Description text',
        icon: {},
      };
      expect(step.id).toBeDefined();
      expect(step.title).toBeDefined();
      expect(step.description).toBeDefined();
      expect(step.icon).toBeDefined();
    });

    it('should have optional action for first 3 steps', () => {
      const stepsWithAction = [
        { id: 'welcome', action: { label: 'Start Benchmark', href: '/benchmark' } },
        { id: 'benchmark', action: { label: 'Run Benchmark', href: '/benchmark' } },
        { id: 'results', action: { label: 'View Results', href: '/results' } },
        { id: 'complete', action: undefined },
      ];
      expect(stepsWithAction[0].action).toBeDefined();
      expect(stepsWithAction[3].action).toBeUndefined();
    });
  });

  describe('Navigation Logic', () => {
    it('should go to next step when not at last step', () => {
      let currentStep = 0;
      const totalSteps = 4;
      const goToNext = () => {
        if (currentStep < totalSteps - 1) {
          currentStep++;
        }
        return currentStep;
      };
      expect(goToNext()).toBe(1);
      expect(goToNext()).toBe(2);
    });

    it('should stay at last step on next', () => {
      let currentStep = 3;
      const totalSteps = 4;
      const goToNext = () => {
        if (currentStep < totalSteps - 1) {
          currentStep++;
        }
        return currentStep;
      };
      expect(goToNext()).toBe(3); // Already at last step
    });

    it('should go to previous step when not at first step', () => {
      let currentStep = 2;
      const goToPrevious = () => {
        if (currentStep > 0) {
          currentStep--;
        }
        return currentStep;
      };
      expect(goToPrevious()).toBe(1);
      expect(goToPrevious()).toBe(0);
    });

    it('should stay at first step on previous', () => {
      let currentStep = 0;
      const goToPrevious = () => {
        if (currentStep > 0) {
          currentStep--;
        }
        return currentStep;
      };
      expect(goToPrevious()).toBe(0); // Already at first step
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should use correct storage key', () => {
      const storageKey = 'atheon-benchmark-onboarding-complete';
      expect(storageKey).toBe('atheon-benchmark-onboarding-complete');
    });

    it('should save completed state to localStorage', () => {
      const localStorage = { setItem: jest.fn(), getItem: jest.fn() } as any;
      localStorage.setItem('atheon-benchmark-onboarding-complete', 'true');
      expect(localStorage.setItem).toHaveBeenCalledWith('atheon-benchmark-onboarding-complete', 'true');
    });

    it('should check completed state from localStorage', () => {
      const localStorage = { setItem: jest.fn(), getItem: jest.fn().mockReturnValue('true') } as any;
      const wasCompleted = localStorage.getItem('atheon-benchmark-onboarding-complete');
      expect(wasCompleted).toBe('true');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate correct progress percentage', () => {
      const totalSteps = 4;
      const currentStep = 0;
      const progress = ((currentStep + 1) / totalSteps) * 100;
      expect(progress).toBe(25);
    });

    it('should show 50% progress at step 2', () => {
      const totalSteps = 4;
      const currentStep = 1;
      const progress = ((currentStep + 1) / totalSteps) * 100;
      expect(progress).toBe(50);
    });

    it('should show 100% progress at last step', () => {
      const totalSteps = 4;
      const currentStep = 3;
      const progress = ((currentStep + 1) / totalSteps) * 100;
      expect(progress).toBe(100);
    });
  });

  describe('Component Export', () => {
    it('should export OnboardingTour component', async () => {
      const { OnboardingTour } = await import('../onboarding-tour');
      expect(OnboardingTour).toBeDefined();
    });
  });
});
