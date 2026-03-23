'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ForecastCategoryInput from '@/components/ForecastCategoryInput';

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

interface Adjustment {
  managerId: string;
  managerName: string;
  categories: ForecastCategories;
  reason: string;
  createdAt: string;
}

interface Forecast {
  _id: string;
  accountName: string;
  opportunityName: string | null;
  repName: string;
  categories: ForecastCategories;
  adjustments: Adjustment[];
  status: 'draft' | 'submitted' | 'approved';
  matchType: 'auto' | 'manual' | 'unmatched';
  period: { type: string; year: number; value: number };
  sfData?: {
    amount: number;
    stage: string;
    closeDate: string;
    probability: number;
    forecastCategory: string;
  } | null;
  submittedAt: string | null;
  approvedAt: string | null;
}

interface HistoryEntry {
  _id: string;
  userName: string;
  changeType: string;
  previousCategories: ForecastCategories | null;
  newCategories: ForecastCategories;
  reason: string | null;
  createdAt: string;
}

export default function ForecastDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [categories, setCategories] = useState<ForecastCategories>({
    commit: 0, consumption: 0, bestCase: 0, services: 0,
  });
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustCategories, setAdjustCategories] = useState<ForecastCategories>({
    commit: 0, consumption: 0, bestCase: 0, services: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, forecastRes, historyRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/forecasts/${id}`),
          fetch(`/api/forecasts/${id}/history`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (forecastRes.ok) {
          const forecastData = await forecastRes.json();
          setForecast(forecastData.forecast);
          setCategories(forecastData.forecast.categories);
          setAdjustCategories(forecastData.forecast.categories);
        } else {
          setError('Forecast not found');
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load forecast');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSave = async (newStatus?: 'submitted') => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/forecasts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          ...(newStatus && { status: newStatus }),
        }),
      });

      if (!response.ok) throw new Error('Failed to update forecast');

      const data = await response.json();
      setForecast(data.forecast);

      if (newStatus === 'submitted') router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustReason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/forecasts/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: adjustCategories,
          reason: adjustReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to adjust forecast');

      const data = await response.json();
      setForecast(data.forecast);
      setShowAdjustModal(false);
      setAdjustReason('');

      const historyRes = await fetch(`/api/forecasts/${id}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/forecasts/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve forecast');

      const data = await response.json();
      setForecast(data.forecast);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this forecast?')) return;

    try {
      const response = await fetch(`/api/forecasts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete forecast');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-factory-card rounded w-1/2"></div>
            <div className="h-64 bg-factory-card rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="card p-12 text-center">
            <p className="text-factory-text-muted">{error || 'Forecast not found'}</p>
            <button onClick={() => router.push('/')} className="btn-primary mt-4">
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = user?._id === forecast.repName;
  const canEdit = forecast.status === 'draft' && (isOwner || user?.role !== 'rep');
  const canAdjust = ['manager', 'director', 'admin'].includes(user?.role || '');
  const canApprove = forecast.status === 'submitted' && canAdjust;

  const statusStyles = {
    draft: 'badge-draft',
    submitted: 'badge-submitted',
    approved: 'badge-approved',
  };

  const latestAdjustment = forecast.adjustments.length > 0
    ? forecast.adjustments[forecast.adjustments.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-factory-bg">
      <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-factory-text">{forecast.accountName}</h1>
            {forecast.opportunityName && (
              <p className="text-sm text-factory-text-dim mt-1">{forecast.opportunityName}</p>
            )}
            <p className="text-sm text-factory-text-dim mt-1">
              <span className="font-mono">
                {forecast.period.type === 'weekly' ? `W${forecast.period.value}` : `Q${forecast.period.value}`} {forecast.period.year}
              </span>
              <span className="mx-2">•</span>
              <span>{forecast.repName}</span>
            </p>
          </div>
          <span className={`badge ${statusStyles[forecast.status]}`}>{forecast.status}</span>
        </div>

        {forecast.sfData && (
          <div className="card p-4 mb-6 bg-factory-accent/5 border-factory-accent/20">
            <h3 className="text-sm font-medium text-factory-accent mb-3">Linked Salesforce Opportunity</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
              <div>
                <span className="text-factory-text-dim block">Amount</span>
                <span className="text-factory-text">${forecast.sfData.amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-factory-text-dim block">Stage</span>
                <span className="text-factory-text">{forecast.sfData.stage}</span>
              </div>
              <div>
                <span className="text-factory-text-dim block">Probability</span>
                <span className="text-factory-text">{forecast.sfData.probability}%</span>
              </div>
              <div>
                <span className="text-factory-text-dim block">Category</span>
                <span className="text-factory-text">{forecast.sfData.forecastCategory}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-factory-text-muted uppercase tracking-wider mb-4">
              Rep Forecast
            </h2>
            <ForecastCategoryInput
              categories={categories}
              onChange={setCategories}
              disabled={!canEdit}
            />
          </div>

          {latestAdjustment && (
            <div className="card p-6 bg-factory-warning/5 border-factory-warning/20">
              <h2 className="text-sm font-semibold text-factory-warning uppercase tracking-wider mb-4">
                Manager Adjustment
              </h2>
              <ForecastCategoryInput
                categories={latestAdjustment.categories}
                onChange={() => {}}
                disabled={true}
              />
              <div className="mt-4 pt-4 border-t border-factory-border">
                <p className="text-sm text-factory-text-dim">
                  Adjusted by <span className="text-factory-text">{latestAdjustment.managerName}</span>
                </p>
                <p className="text-sm text-factory-text-muted mt-1">{latestAdjustment.reason}</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-factory-error/10 border border-factory-error/30 rounded-lg">
            <p className="text-sm text-factory-error">{error}</p>
          </div>
        )}

        <div className="flex justify-between mb-8">
          <div>
            {canEdit && (
              <button onClick={handleDelete} className="text-sm text-factory-error hover:text-factory-error/80">
                Delete Forecast
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button onClick={() => router.back()} className="btn-secondary">Back</button>
            {canAdjust && forecast.status !== 'draft' && (
              <button onClick={() => setShowAdjustModal(true)} className="btn-secondary">
                Add Adjustment
              </button>
            )}
            {canApprove && (
              <button onClick={handleApprove} disabled={isSaving} className="btn-primary disabled:opacity-50">
                Approve
              </button>
            )}
            {canEdit && (
              <>
                <button onClick={() => handleSave()} disabled={isSaving} className="btn-secondary disabled:opacity-50">
                  Save Draft
                </button>
                <button onClick={() => handleSave('submitted')} disabled={isSaving} className="btn-primary disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Submit'}
                </button>
              </>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="card">
            <div className="px-6 py-4 border-b border-factory-border">
              <h2 className="text-lg font-semibold text-factory-text">History</h2>
            </div>
            <div className="divide-y divide-factory-border">
              {history.map((entry) => (
                <div key={entry._id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-medium text-factory-text">{entry.userName}</span>
                      <span className="mx-2 text-factory-text-dim">•</span>
                      <span className="text-sm text-factory-text-muted capitalize">{entry.changeType}</span>
                    </div>
                    <span className="text-xs text-factory-text-dim">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {entry.reason && (
                    <p className="text-sm text-factory-text-muted mt-1">{entry.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-factory-text mb-4">Manager Adjustment</h2>
            <ForecastCategoryInput
              categories={adjustCategories}
              onChange={setAdjustCategories}
            />
            <div className="mt-4">
              <label className="label">Reason for Adjustment</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="input h-24 resize-none"
                placeholder="Explain the adjustment..."
                required
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowAdjustModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleAdjust} disabled={isSaving} className="btn-primary disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
