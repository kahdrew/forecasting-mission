'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import ForecastCategoryInput from '@/components/ForecastCategoryInput';
import { PeriodType } from '@/models/Period';

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

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function NewForecastPage() {
  const router = useRouter();
  const now = new Date();

  const [user, setUser] = useState<User | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [year, setYear] = useState(now.getFullYear());
  const [value, setValue] = useState(getWeekNumber(now));
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
      if (searchQuery.length < 2) {
        setOpportunities([]);
        return;
      }

      try {
        const res = await fetch(`/api/salesforce/opportunities?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setOpportunities(data.opportunities);
        }
      } catch (error) {
        console.error('Failed to search opportunities:', error);
      }
    }

    const debounce = setTimeout(searchOpportunities, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

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
          period: { type: periodType, year, value },
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
        throw new Error('Failed to create forecast');
      }

      const data = await response.json();

      if (status === 'submitted') {
        await fetch(`/api/forecasts/${data.forecast._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'submitted' }),
        });
      }

      router.push('/');
    } catch (error) {
      console.error('Failed to save forecast:', error);
      alert('Failed to save forecast');
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
          <p className="text-sm text-factory-text-dim mt-1">Create a forecast for an account or opportunity</p>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-factory-text-muted uppercase tracking-wider mb-4">
              Period
            </h2>
            <PeriodSelector
              periodType={periodType}
              selectedYear={year}
              selectedValue={value}
              onPeriodTypeChange={setPeriodType}
              onPeriodChange={(y, v) => { setYear(y); setValue(v); }}
            />
          </div>

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

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-factory-text-muted uppercase tracking-wider mb-4">
              Forecast Categories
            </h2>
            <ForecastCategoryInput categories={categories} onChange={setCategories} />
          </div>

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
