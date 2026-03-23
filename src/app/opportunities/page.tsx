'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

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

export default function OpportunitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOpportunities = async (query?: string, sync?: boolean) => {
    if (sync) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (sync) params.set('sync', 'true');

      const response = await fetch(`/api/salesforce/opportunities?${params}`);
      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }

      await fetchOpportunities();
    }

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities(searchQuery);
  };

  const handleSync = () => {
    fetchOpportunities(searchQuery, true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-factory-card rounded w-1/4"></div>
            <div className="h-12 bg-factory-card rounded"></div>
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
            <h1 className="text-2xl font-bold text-factory-text">Opportunities</h1>
            <p className="text-sm text-factory-text-dim mt-1">Synced from Salesforce</p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing || !user?.hasSalesforce}
            className="btn-primary disabled:opacity-50"
          >
            {isSyncing ? (
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Syncing...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sync from Salesforce</span>
              </span>
            )}
          </button>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearch} className="p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by account or opportunity name..."
                className="input flex-1"
              />
              <button type="submit" className="btn-secondary">Search</button>
            </div>
          </form>
        </div>

        <div className="card">
          {opportunities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-factory-card flex items-center justify-center">
                <svg className="w-8 h-8 text-factory-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              {user?.hasSalesforce ? (
                <p className="text-factory-text-muted">No opportunities found. Click &quot;Sync from Salesforce&quot; to fetch.</p>
              ) : (
                <div>
                  <p className="text-factory-text-muted mb-2">Connect your Salesforce account to view opportunities.</p>
                  <a href="/connect" className="text-factory-accent hover:text-factory-accent-hover text-sm font-medium">
                    Connect Salesforce
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-factory-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">
                      Account / Opportunity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-factory-text-muted uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-factory-text-muted uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">
                      Close Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr key={opp.sfId} className="border-b border-factory-border hover:bg-factory-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-factory-text">{opp.accountName}</div>
                        <div className="text-sm text-factory-text-dim">{opp.name}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-factory-text">
                        ${opp.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-factory-text">{opp.stageName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                          opp.probability >= 75 ? 'bg-factory-success/20 text-factory-success' :
                          opp.probability >= 50 ? 'bg-factory-warning/20 text-factory-warning' :
                          'bg-factory-card text-factory-text-muted'
                        }`}>
                          {opp.probability}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-factory-text">
                        {new Date(opp.closeDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-factory-text-dim">{opp.forecastCategory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
