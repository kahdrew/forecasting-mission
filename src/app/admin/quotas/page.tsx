'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface User {
  _id: string;
  name: string;
  role: string;
  hasSalesforce: boolean;
}

interface Quota {
  _id: string;
  userId: string;
  userName: string;
  period: { type: string; year: number; value: number };
  amount: number;
}

export default function AdminQuotasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        // Would need admin endpoint to list all quotas
        setQuotas([]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filterYear]);

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

  if (!['director', 'admin'].includes(user?.role || '')) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-12 text-center">
            <p className="text-factory-text-muted">Only directors and administrators can manage quotas.</p>
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
            <h1 className="text-2xl font-bold text-factory-text">Quota Management</h1>
            <p className="text-sm text-factory-text-dim mt-1">Set and manage sales quotas</p>
          </div>
          <button className="btn-primary">Set Quotas</button>
        </div>

        <div className="card mb-6 p-4">
          <div className="flex space-x-4">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="input w-32"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          {quotas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-factory-card flex items-center justify-center">
                <svg className="w-8 h-8 text-factory-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-factory-text-muted mb-2">No quotas set yet.</p>
              <p className="text-sm text-factory-text-dim">Set quotas for your team members to enable attainment tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-factory-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-factory-text-muted uppercase tracking-wider">Quota</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-factory-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotas.map((quota) => (
                    <tr key={quota._id} className="border-b border-factory-border hover:bg-factory-hover">
                      <td className="px-4 py-3 text-factory-text">{quota.userName}</td>
                      <td className="px-4 py-3 font-mono text-factory-text-muted">
                        {quota.period.type === 'weekly' ? `W${quota.period.value}` : `Q${quota.period.value}`} {quota.period.year}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-factory-text">
                        ${quota.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-sm text-factory-accent hover:text-factory-accent-hover">Edit</button>
                      </td>
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
