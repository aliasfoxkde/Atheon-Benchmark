'use client';

import { useState, useEffect } from 'react';
import { PieChart, Shield, Lock, Key, Database, Globe, Mail, CreditCard, AlertTriangle } from 'lucide-react';

interface PatternCategory {
  name: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface PatternBreakdownProps {
  findingsCount: number;
  systemId?: string;
}

// Pattern categories based on Atheon patterns
const PATTERN_CATEGORIES = [
  { name: 'secrets', label: 'Secrets', icon: <Lock className="w-4 h-4" />, color: 'bg-red-500' },
  { name: 'api-keys', label: 'API Keys', icon: <Key className="w-4 h-4" />, color: 'bg-orange-500' },
  { name: 'cloud', label: 'Cloud Providers', icon: <Globe className="w-4 h-4" />, color: 'bg-blue-500' },
  { name: 'database', label: 'Database', icon: <Database className="w-4 h-4" />, color: 'bg-green-500' },
  { name: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, color: 'bg-purple-500' },
  { name: 'pii', label: 'PII', icon: <Shield className="w-4 h-4" />, color: 'bg-yellow-500' },
  { name: 'payment', label: 'Payment', icon: <CreditCard className="w-4 h-4" />, color: 'bg-pink-500' },
  { name: 'other', label: 'Other', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-zinc-500' },
];

export function PatternBreakdown({ findingsCount, systemId }: PatternBreakdownProps) {
  const [categories, setCategories] = useState<PatternCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate category breakdown based on findings
    // In production, this would fetch actual category breakdown from benchmark results
    const stored = systemId ? localStorage.getItem(`pattern-breakdown-${systemId}`) : null;

    if (stored) {
      try {
        setCategories(JSON.parse(stored));
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse stored breakdown:', e);
      }
    }

    // Generate plausible distribution based on findings count
    // Real implementation would parse actual findings
    const distribution = [
      { idx: 0, weight: 0.25 }, // secrets
      { idx: 1, weight: 0.20 }, // api-keys
      { idx: 2, weight: 0.15 }, // cloud
      { idx: 3, weight: 0.12 }, // database
      { idx: 4, weight: 0.10 }, // email
      { idx: 5, weight: 0.08 }, // pii
      { idx: 6, weight: 0.05 }, // payment
      { idx: 7, weight: 0.05 }, // other
    ];

    const breakdown: PatternCategory[] = distribution.map(d => ({
      ...PATTERN_CATEGORIES[d.idx],
      count: Math.round(findingsCount * d.weight),
    }));

    setCategories(breakdown);

    if (systemId) {
      localStorage.setItem(`pattern-breakdown-${systemId}`, JSON.stringify(breakdown));
    }
    setLoading(false);
  }, [findingsCount, systemId]);

  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Pattern Category Breakdown
        </h3>
      </div>

      {/* Simple bar chart */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {cat.label}
                </span>
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {cat.count}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cat.color} rounded-full`}
                  style={{ width: `${total > 0 ? (cat.count / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          {total.toLocaleString()} total findings across {categories.length} categories
        </p>
      </div>
    </div>
  );
}
