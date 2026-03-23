'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ForecastCard from '@/components/ForecastCard';
import QuotaGauge from '@/components/QuotaGauge';

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
  submissionPeriod: { week: number; year: number };
  targetPeriod: { quarter: number; year: number };
  sfData?: { amount: number; stage: string; probability: number } | null;
}

interface RollupResult {
  categories: ForecastCategories;
  adjustedCategories: ForecastCategories;
  forecastCount: number;
}

// Fiscal year helpers
function getFiscalYear(date: Date): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month < 1 ? year : year + 1; // Feb 1 start
}

function getWeekNumber(date: Date): number {
  const fiscalYear = getFiscalYear(date);
  const fiscalYearStart = new Date(Date.UTC(fiscalYear - 1, 1, 1)); // Feb 1
  const firstMonday = new Date(fiscalYearStart);
  const dayOfWeek = firstMonday.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
  firstMonday.setUTCDate(firstMonday.getUTCDate() + daysUntilMonday);
  
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const diffDays = Math.floor((d.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 52;
  return Math.min(52, Math.floor(diffDays / 7) + 1);
}

function getQuarterFromWeek(week: number): number {
  if (week <= 13) return 1;
  if (week <= 26) return 2;
  if (week <= 39) return 3;
  return 4;
}

export default function DashboardPage() {
  const now = new Date();
  const fiscalYear = getFiscalYear(now);
  const currentWeek = getWeekNumber(now);
  const currentQuarter = getQuarterFromWeek(currentWeek);

  const [user, setUser] = useState<User | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [rollup, setRollup] = useState<RollupResult | null>(null);
  const [targetQuarter, setTargetQuarter] = useState(currentQuarter);
  const [targetYear, setTargetYear] = useState(fiscalYear);
  const [submissionWeek, setSubmissionWeek] = useState(currentWeek);
  const [submissionYear, setSubmissionYear] = useState(fiscalYear);
  const [quota, setQuota] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [userRes, forecastsRes, rollupRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/forecasts?submissionWeek=${submissionWeek}&submissionYear=${submissionYear}&targetQuarter=${targetQuarter}&targetYear=${targetYear}`),
          fetch(`/api/forecasts/rollup?targetQuarter=${targetQuarter}&targetYear=${targetYear}&submissionWeek=${submissionWeek}&submissionYear=${submissionYear}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);

          const quotaRes = await fetch(`/api/users/${userData.user._id}/quota?periodType=quarterly&year=${targetYear}`);
          if (quotaRes.ok) {
            const quotaData = await quotaRes.json();
            const currentQuota = quotaData.quotas.find(
              (q: { period: { value: number } }) => q.period.value === targetQuarter
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
  }, [submissionWeek, submissionYear, targetQuarter, targetYear]);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    let newWeek = direction === 'prev' ? submissionWeek - 1 : submissionWeek + 1;
    let newYear = submissionYear;
    
    if (newWeek < 1) {
      newYear--;
      newWeek = 52;
    } else if (newWeek > 52) {
      newYear++;
      newWeek = 1;
    }
    
    setSubmissionWeek(newWeek);
    setSubmissionYear(newYear);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-factory-text">Dashboard</h1>
            <p className="text-sm text-factory-text-dim mt-1">Weekly forecast submissions for quarterly targets</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Target Quarter Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-factory-text-muted">Target:</span>
              <select
                value={`${targetYear}-Q${targetQuarter}`}
                onChange={(e) => {
                  const [y, q] = e.target.value.split('-Q');
                  setTargetYear(parseInt(y));
                  setTargetQuarter(parseInt(q));
                }}
                className="input w-36 text-sm"
              >
                {[fiscalYear - 1, fiscalYear, fiscalYear + 1].map(y => 
                  [1, 2, 3, 4].map(q => (
                    <option key={`${y}-Q${q}`} value={`${y}-Q${q}`}>
                      FY{y} Q{q}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Submission Week Selector */}
            <div className="flex items-center">
              <span className="text-sm text-factory-text-muted mr-2">Week:</span>
              <button
                onClick={() => handleWeekChange('prev')}
                className="p-2 hover:bg-factory-hover rounded-l-lg border border-factory-border text-factory-text-muted hover:text-factory-text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="px-4 py-2 bg-factory-card border-y border-factory-border text-sm font-mono">
                FY{submissionYear} W{submissionWeek}
              </div>
              <button
                onClick={() => handleWeekChange('next')}
                className="p-2 hover:bg-factory-hover rounded-r-lg border border-factory-border text-factory-text-muted hover:text-factory-text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quarter Context Banner */}
        <div className="card p-4 mb-6 bg-factory-accent/5 border-factory-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-factory-text-muted">Forecasting for </span>
              <span className="text-lg font-bold text-factory-accent">FY{targetYear} Q{targetQuarter}</span>
              <span className="text-sm text-factory-text-muted ml-2">| Submission week: </span>
              <span className="font-mono text-factory-text">W{submissionWeek}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-factory-text-dim">Q{targetQuarter} = Weeks {(targetQuarter - 1) * 13 + 1}-{targetQuarter * 13}</span>
            </div>
          </div>
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
                  <div className="stat-label">Q{targetQuarter} Total Forecast</div>
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
              <QuotaGauge forecast={total} quota={quota} label="Q Attainment" />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-factory-text">My Forecasts (W{submissionWeek} → Q{targetQuarter})</h2>
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
            <p className="text-factory-text-muted mb-2">No forecasts for W{submissionWeek} targeting Q{targetQuarter}</p>
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
