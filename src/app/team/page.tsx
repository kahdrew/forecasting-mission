'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import RollupTable from '@/components/RollupTable';
import { PeriodType } from '@/models/Period';

interface User {
  _id: string;
  name: string;
  role: string;
  hasSalesforce: boolean;
}

interface ForecastCategories {
  commit: number;
  consumption: number;
  bestCase: number;
  services: number;
}

interface RollupResult {
  userId: string;
  userName: string;
  role: string;
  categories: ForecastCategories;
  adjustedCategories: ForecastCategories;
  forecastCount: number;
  children?: RollupResult[];
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function TeamPage() {
  const now = new Date();
  const [user, setUser] = useState<User | null>(null);
  const [teamRollups, setTeamRollups] = useState<RollupResult[]>([]);
  const [totals, setTotals] = useState<ForecastCategories>({
    commit: 0,
    consumption: 0,
    bestCase: 0,
    services: 0,
  });
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [year, setYear] = useState(now.getFullYear());
  const [value, setValue] = useState(getWeekNumber(now));
  const [showAdjusted, setShowAdjusted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [userRes, rollupRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/forecasts/rollup?periodType=${periodType}&year=${year}&value=${value}&view=team`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (rollupRes.ok) {
          const rollupData = await rollupRes.json();
          setTeamRollups(rollupData.team || []);
          setTotals(rollupData.totals || { commit: 0, consumption: 0, bestCase: 0, services: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periodType, year, value]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-factory-card rounded w-1/4"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-factory-card rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-factory-card rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  if (user?.role === 'rep') {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-factory-card flex items-center justify-center">
              <svg className="w-8 h-8 text-factory-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-factory-text-muted">Team view is only available for managers and above.</p>
          </div>
        </main>
      </div>
    );
  }

  const grandTotal = totals.commit + totals.consumption + totals.bestCase + totals.services;

  const statCards = [
    { label: 'Commit', value: totals.commit, color: 'text-factory-success', bg: 'bg-factory-success/10' },
    { label: 'Consumption', value: totals.consumption, color: 'text-factory-accent', bg: 'bg-factory-accent/10' },
    { label: 'Best Case', value: totals.bestCase, color: 'text-factory-warning', bg: 'bg-factory-warning/10' },
    { label: 'Services', value: totals.services, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total', value: grandTotal, color: 'text-white', bg: 'bg-factory-accent' },
  ];

  return (
    <div className="min-h-screen bg-factory-bg">
      <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-factory-text">Team Rollup</h1>
            <p className="text-sm text-factory-text-dim mt-1">Aggregated forecasts across your team</p>
          </div>
          <PeriodSelector
            periodType={periodType}
            selectedYear={year}
            selectedValue={value}
            onPeriodTypeChange={setPeriodType}
            onPeriodChange={(y, v) => { setYear(y); setValue(v); }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <div key={stat.label} className={`stat-card ${stat.bg} ${index === 4 ? 'text-white' : ''}`}>
              <div className={`stat-label ${index === 4 ? 'text-white/80' : ''}`}>{stat.label}</div>
              <div className={`stat-value ${stat.color}`}>${stat.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-factory-border flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-factory-text">Team Members</h2>
              <p className="text-sm text-factory-text-dim">{teamRollups.length} direct reports</p>
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showAdjusted}
                onChange={(e) => setShowAdjusted(e.target.checked)}
                className="rounded border-factory-border bg-factory-bg text-factory-accent focus:ring-factory-accent"
              />
              <span className="text-factory-text-muted">Show Adjusted Values</span>
            </label>
          </div>
          {teamRollups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-factory-text-muted">No team members found or no forecasts submitted.</p>
            </div>
          ) : (
            <RollupTable data={teamRollups} totals={totals} showHierarchy={true} showAdjusted={showAdjusted} />
          )}
        </div>
      </main>
    </div>
  );
}
