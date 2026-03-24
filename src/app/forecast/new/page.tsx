'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ForecastCategoryInput from '@/components/ForecastCategoryInput';

interface User {
  _id: string;
  name: string;
  role: string;
  hasSalesforce: boolean;
}

interface Opportunity {
  _id: string;
  sfId: string;
  name: string;
  accountName: string;
  amount: number;
  stageName: string;
  closeDate: string;
  probability: number;
  forecastCategory: string;
}

interface ForecastCategories {
  commit: number;
  consumption: number;
  bestCase: number;
  services: number;
}

// Fiscal year helpers
function getFiscalYear(date: Date): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month < 1 ? year : year + 1;
}

function getWeekNumber(date: Date): number {
  const fiscalYear = getFiscalYear(date);
  const fiscalYearStart = new Date(Date.UTC(fiscalYear - 1, 1, 1));
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

export default function NewForecastPage() {
  const router = useRouter();
  const now = new Date();
  const fiscalYear = getFiscalYear(now);
  const currentWeek = getWeekNumber(now);
  const currentQuarter = getQuarterFromWeek(currentWeek);

  const [user, setUser] = useState<User | null>(null);
  // Submission period (when entering - always current week)
  const [submissionWeek] = useState(currentWeek);
  const [submissionYear] = useState(fiscalYear);
  // Target period (what quarter this forecast is for)
  const [targetQuarter, setTargetQuarter] = useState(currentQuarter);
  const [targetYear, setTargetYear] = useState(fiscalYear);
  
  const [accountName, setAccountName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [categories, setCategories] = useState<ForecastCategories>({
    commit: 0,
    consumption: 0,
    bestCase: 0,
    services: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function searchOpportunities() {
      if (searchQuery.length < 2 || !user?.hasSalesforce) {
        setOpportunities([]);
        return;
      }

      try {
        const res = await fetch(`/api/salesforce/opportunities?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setOpportunities(data.opportunities || []);
        }
      } catch (error) {
        console.error('Failed to search opportunities:', error);
        setOpportunities([]);
      }
    }

    const debounce = setTimeout(searchOpportunities, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.hasSalesforce]);

  const handleSelectOpp = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setAccountName(opp.accountName);
    setShowSuggestions(false);

    if (opp.forecastCategory === 'Commit') {
      setCategories({ ...categories, commit: opp.amount });
    } else if (opp.forecastCategory === 'Best Case') {
      setCategories({ ...categories, bestCase: opp.amount });
    }
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!accountName.trim()) {
      alert('Please enter an account name');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/forecasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: selectedOpp?.sfId || null,
          opportunityName: selectedOpp?.name || null,
          accountName,
          submissionPeriod: { week: submissionWeek, year: submissionYear },
          targetPeriod: { quarter: targetQuarter, year: targetYear },
          categories,
          sfData: selectedOpp
            ? {
                amount: selectedOpp.amount,
                stage: selectedOpp.stageName,
                closeDate: selectedOpp.closeDate,
                probability: selectedOpp.probability,
                forecastCategory: selectedOpp.forecastCategory,
              }
            : null,
          matchType: selectedOpp ? 'auto' : 'unmatched',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create forecast');
      }

      const data = await response.json();

      if (status === 'submitted') {
        const submitRes = await fetch(`/api/forecasts/${data.forecast._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'submitted' }),
        });
        if (!submitRes.ok) {
          console.error('Failed to submit forecast, saved as draft');
        }
      }

      router.push('/');
    } catch (error) {
      console.error('Failed to save forecast:', error);
      alert(error instanceof Error ? error.message : 'Failed to save forecast');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-factory-card rounded w-1/3"></div>
            <div className="h-64 bg-factory-card rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-factory-bg">
      <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-factory-text">New Forecast</h1>
          <p className="text-sm text-factory-text-dim mt-1">Enter your weekly forecast for the target quarter</p>
        </div>

        <div className="space-y-6">
          {/* Period Selection */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-factory-text-muted uppercase tracking-wider mb-4">
              Forecast Period
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submission Week (read-only - current week) */}
              <div>
                <label className="label">Submission Week</label>
                <div className="input bg-factory-bg cursor-not-allowed">
                  <span className="font-mono">FY{submissionYear} W{submissionWeek}</span>
                  <span className="text-factory-text-dim ml-2">(current week)</span>
                </div>
              </div>

              {/* Target Quarter (selectable) */}
              <div>
                <label className="label">Target Quarter</label>
                <select
                  value={`${targetYear}-Q${targetQuarter}`}
                  onChange={(e) => {
                    const [y, q] = e.target.value.split('-Q');
                    setTargetYear(parseInt(y));
                    setTargetQuarter(parseInt(q));
                  }}
                  className="input"
                >
                  {[fiscalYear - 1, fiscalYear, fiscalYear + 1].map(y => 
                    [1, 2, 3, 4].map(q => (
                      <option key={`${y}-Q${q}`} value={`${y}-Q${q}`}>
                        FY{y} Q{q}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-factory-text-dim mt-1">
                  Q{targetQuarter} = Weeks {(targetQuarter - 1) * 13 + 1}-{targetQuarter * 13}
                </p>
              </div>
            </div>

            {/* Context Banner */}
            <div className="mt-4 p-3 bg-factory-accent/10 border border-factory-accent/20 rounded-lg">
              <p className="text-sm text-factory-text">
                <span className="text-factory-text-muted">You are submitting a </span>
                <span className="font-semibold">Week {submissionWeek}</span>
                <span className="text-factory-text-muted"> forecast for </span>
                <span className="font-semibold text-factory-accent">Q{targetQuarter} FY{targetYear}</span>
              </p>
            </div>
          </div>

          {/* Account / Opportunity */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-factory-text-muted uppercase tracking-wider mb-4">
              Account / Opportunity
            </h2>

            <div className="relative">
              <label className="label">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => {
                  setAccountName(e.target.value);
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  if (!e.target.value) setSelectedOpp(null);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="input"
                placeholder="Search for an account..."
              />

              {showSuggestions && opportunities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-factory-card border border-factory-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {opportunities.map((opp) => (
                    <button
                      key={opp._id}
                      onClick={() => handleSelectOpp(opp)}
                      className="w-full px-4 py-3 text-left hover:bg-factory-hover border-b border-factory-border last:border-0"
                    >
                      <div className="font-medium text-factory-text">{opp.accountName}</div>
                      <div className="text-sm text-factory-text-dim">{opp.name}</div>
                      <div className="text-xs text-factory-text-dim mt-1">
                        ${opp.amount.toLocaleString()} • {opp.stageName} • {opp.probability}%
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedOpp && (
              <div className="mt-4 p-4 bg-factory-accent/5 border border-factory-accent/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-factory-accent">Linked Opportunity</span>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="text-xs text-factory-text-dim hover:text-factory-text"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-sm text-factory-text">{selectedOpp.name}</div>
                <div className="text-xs text-factory-text-dim mt-1">
                  ${selectedOpp.amount.toLocaleString()} • {selectedOpp.stageName} • {selectedOpp.forecastCategory}
                </div>
              </div>
            )}
          </div>

          {/* Forecast Categories */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-factory-text-muted uppercase tracking-wider mb-4">
              Q{targetQuarter} Forecast Categories
            </h2>
            <ForecastCategoryInput categories={categories} onChange={setCategories} />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
              className="btn-secondary disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('submitted')}
              disabled={isSaving}
              className="btn-primary disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Submit Forecast'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
