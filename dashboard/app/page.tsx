'use client';

import { OnboardingTour } from '@/components/onboarding-tour';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="flex flex-col items-center gap-8 text-center max-w-6xl w-full">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              Atheon Benchmark
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Community AI Benchmark Platform
            </p>
          </div>
        </div>

        <p className="max-w-3xl text-2xl text-zinc-700 dark:text-zinc-300 leading-relaxed">
          Run benchmarks locally on your system, upload results to GitHub, and compare performance across different hardware configurations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl w-full">
          <div className="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Local Execution</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Run benchmarks natively on your system with our CLI tool. Get accurate performance data for your specific hardware.
            </p>
          </div>

          <div className="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 hover:shadow-xl hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Results Sharing</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Upload results to GitHub and share with the community. Contribute to the collective benchmark database.
            </p>
          </div>

          <div className="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">System Comparison</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Compare performance across different hardware configurations. Make informed decisions with real-world data.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-16 w-full">
          <div className="flex gap-4 w-full">
            <a
              href="/results"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-center"
            >
              View Benchmark Results
            </a>
            <a
              href="https://github.com/aliasfoxkde/Atheon-Benchmark/tree/main/runner"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-8 py-4 border-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl transition-all duration-300 text-center"
            >
              Download Runner →
            </a>
          </div>
        </div>

        <div className="mt-20 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 max-w-3xl w-full">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Powered by Atheon</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                This benchmark system is built on top of the Atheon pattern matching engine, a community-driven project for detecting any pattern that can be described as a rule.
              </p>
              <div className="flex gap-6 text-sm">
                <a
                  href="https://github.com/HoraDomu/Atheon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Atheon on GitHub →
                </a>
                <a
                  href="https://github.com/HoraDomu/Atheon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 dark:text-zinc-400 hover:underline font-medium"
                >
                  Documentation →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Tour for first-time visitors */}
        <OnboardingTour />
      </div>
    </div>
  );
}
