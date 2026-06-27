'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const isInstalledRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const installed = isStandalone || isInWebAppiOS || false;
    setIsInstalled(installed);
    isInstalledRef.current = installed;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Use ref to check current value inside timeout
      setTimeout(() => {
        if (!isInstalledRef.current) setShowPrompt(true);
      }, 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      isInstalledRef.current = true;
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isInstalled || !deferredPrompt || !showPrompt || sessionStorage.getItem('pwa-install-dismissed') === 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Install App</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Add to home screen for faster access</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" aria-label="Dismiss install prompt">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handleInstall} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
            Install
          </button>
          <button onClick={handleDismiss} className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm transition-colors">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
