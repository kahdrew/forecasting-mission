'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import ForecastCard from '@/components/ForecastCard';
import QuotaGauge from '@/components/QuotaGauge';
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

interface RollupResult {
  categories: ForecastCategories;
  adjustedCategories: ForecastCategories;
  forecastCount: number;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function DashboardPage() {
  const now = new Date();
  const [user, setUser] = useState<User | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [rollup, setRollup] = useState<RollupResult | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [year, setYear] = useState(now.getFullYear());
  const [value, setValue] = useState(getWeekNumber(now));
  const [quota, setQuota] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [userRes, forecastsRes, rollupRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/forecasts?periodType=${periodType}&year=${year}&value=${value}`),
          fetch(`/api/forecasts/rollup?periodType=${periodType}&year=${year}&value=${value}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);

          const quotaRes = await fetch(`/api/users/${userData.user._id}/quota?periodType=${periodType}&year=${year}`);
          if (quotaRes.ok) {
            const quotaData = await quotaRes.json();
            const currentQuota = quotaData.quotas.find(
              (q: { period: { value: number } }) => q.period.value === value
            );
            setQuota(currentQuota?.amount || 0);
          }
        }

        if (forecastsRes.ok) {
          const forecastsData = await forecastsRes.json();
          setForecasts(forecastsData.forecasts);
        }

        if (rollupRes.ok) {
          const rollupData = await rollupRes.json();
          setRollup(rollupData.rollup);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periodType, year, value]);

  const handlePeriodChange = (newYear: number, newValue: number) => {
    setYear(newYear);
    setValue(newValue);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-factory-card rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-factory-card rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-factory-card rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  const categories = rollup?.adjustedCategories || { commit: 0, consumption: 0, bestCase: 0, services: 0 };
  const total = categories.commit + categories.consumption + categories.bestCase + categories.services;

  const statCards = [
    { label: 'Commit', value: categories.commit, color: 'text-factory-success', bg: 'bg-factory-success/10' },
    { label: 'Consumption', value: categories.consumption, color: 'text-factory-accent', bg: 'bg-factory-accent/10' },
    { label: 'Best Case', value: categories.bestCase, color: 'text-factory-warning', bg: 'bg-factory-warning/10' },
    { label: 'Services', value: categories.services, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="min-h-screen bg-factory-bg">
      <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-factory-text">Dashboard</h1>
            <p className="text-sm text-factory-text-dim mt-1">Your forecast overview</p>
          </div>
          <PeriodSelector
            periodType={periodType}
            selectedYear={year}
            selectedValue={value}
            onPeriodTypeChange={setPeriodType}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((stat) => (
                <div key={stat.label} className={`stat-card ${stat.bg}`}>
                  <div className="stat-label">{stat.label}</div>
                  <div className={`stat-value ${stat.color}`}>
                    ${stat.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-5 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="stat-label">Total Forecast</div>
                  <div className="stat-value text-3xl">${total.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="stat-label">Forecasts</div>
                  <div className="text-2xl font-bold text-factory-text">{rollup?.forecastCount || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {quota > 0 && (
            <div className="card p-5 flex items-center justify-center">
              <QuotaGauge forecast={total} quota={quota} label="Attainment" />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-factory-text">My Forecasts</h2>
          <Link href="/forecast/new" className="btn-primary text-sm">
            + New Forecast
          </Link>
        </div>

        {forecasts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-factory-card flex items-center justify-center">
              <svg className="w-8 h-8 text-factory-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-factory-text-muted mb-2">No forecasts for this period</p>
            <Link href="/forecast/new" className="text-factory-accent hover:text-factory-accent-hover text-sm font-medium">
              Create your first forecast
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecasts.map((forecast) => (
              <ForecastCard key={forecast._id} forecast={forecast} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
