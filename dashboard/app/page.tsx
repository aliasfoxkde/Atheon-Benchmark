export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-6xl flex-col items-center justify-between py-20 px-8 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-black dark:text-zinc-50">
              Atheon Benchmark
            </h1>
          </div>

          <p className="max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
            Comprehensive AI benchmark system comparing Claude performance with and without Atheon MCP integration
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl">
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">Fast & Reliable</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Deterministic benchmarks with reproducible results</p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">Quality Gates</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Atheon integration for security and validation</p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">Detailed Analytics</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Real-time results with statistical analysis</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-12">
            <a href="/benchmark" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center">
              Run Benchmark
            </a>
            <a href="/results" className="px-8 py-3 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors text-center">
              View Results
            </a>
          </div>

          <div className="mt-16 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 max-w-2xl">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">Powered by Atheon</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              This benchmark system is built on top of the Atheon pattern matching engine,
              a community-driven project for detecting any pattern that can be described as a rule.
            </p>
            <div className="flex gap-4 text-sm">
              <a
                href="https://github.com/HoraDomu/Atheon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Atheon on GitHub →
              </a>
              <a
                href="https://github.com/HoraDomu/Atheon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:underline"
              >
                Documentation →
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-sm text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
        <p>© 2026 Atheon Benchmark. Built with ❤️ for the AI community.</p>
        <p className="mt-2">
          Powered by <a href="https://github.com/HoraDomu/Atheon" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Atheon</a> •
          <a href="https://github.com/HoraDomu/Atheon" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
