'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ForecastCard from '@/components/ForecastCard';
import PeriodSelector from '@/components/PeriodSelector';
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

interface Forecast {
  _id: string;
  accountName: string;
  opportunityName: string | null;
  categories: ForecastCategories;
  status: 'draft' | 'submitted' | 'approved';
  matchType: 'auto' | 'manual' | 'unmatched';
  period: { type: string; year: number; value: number };
  sfData?: { amount: number; stage: string; probability: number } | null;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function HistoryPage() {
  const now = new Date();
  const [user, setUser] = useState<User | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [year, setYear] = useState(now.getFullYear());
  const [value, setValue] = useState(getWeekNumber(now));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('periodType', periodType);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const [userRes, forecastsRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/forecasts?${params}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (forecastsRes.ok) {
          const forecastsData = await forecastsRes.json();
          setForecasts(forecastsData.forecasts);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [statusFilter, periodType]);

  const groupedForecasts = forecasts.reduce<Record<string, Forecast[]>>((acc, forecast) => {
    const key = `${forecast.period.year}-${forecast.period.value}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(forecast);
    return acc;
  }, {});

  const sortedPeriods = Object.keys(groupedForecasts).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-factory-card rounded w-1/4"></div>
            <div className="h-64 bg-factory-card rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-factory-bg">
      <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-factory-text">History</h1>
            <p className="text-sm text-factory-text-dim mt-1">All your forecast submissions</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-36 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
            </select>
            <PeriodSelector
              periodType={periodType}
              selectedYear={year}
              selectedValue={value}
              onPeriodTypeChange={setPeriodType}
              onPeriodChange={(y, v) => { setYear(y); setValue(v); }}
              showTypeSelector={true}
            />
          </div>
        </div>

        {forecasts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-factory-card flex items-center justify-center">
              <svg className="w-8 h-8 text-factory-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-factory-text-muted mb-2">No forecasts found</p>
            <Link href="/forecast/new" className="text-factory-accent hover:text-factory-accent-hover text-sm font-medium">
              Create your first forecast
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedPeriods.map((period) => {
              const periodForecasts = groupedForecasts[period];
              const [periodYear, periodValue] = period.split('-').map(Number);

              const periodTotal = periodForecasts.reduce(
                (acc, f) => acc + f.categories.commit + f.categories.consumption + f.categories.bestCase + f.categories.services,
                0
              );

              return (
                <div key={period} className="card">
                  <div className="px-6 py-4 border-b border-factory-border flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-factory-text font-mono">
                        {periodType === 'weekly' ? `W${periodValue}` : periodType === 'monthly' ? 
                          new Date(periodYear, periodValue - 1).toLocaleDateString('en-US', { month: 'long' }) : 
                          `Q${periodValue}`} {periodYear}
                      </h2>
                      <p className="text-sm text-factory-text-dim">
                        {periodForecasts.length} forecast{periodForecasts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-factory-text-dim">Period Total</p>
                      <p className="text-xl font-bold font-mono text-factory-text">
                        ${periodTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {periodForecasts.map((forecast) => (
                        <ForecastCard key={forecast._id} forecast={forecast} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
