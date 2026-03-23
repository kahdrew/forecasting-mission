'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface User {
  _id: string;
  name: string;
  role: string;
  hasSalesforce: boolean;
}

interface Period {
  _id: string;
  type: string;
  year: number;
  value: number;
  startDate: string;
  endDate: string;
  submissionDeadline: string | null;
  isLocked: boolean;
}

export default function AdminPeriodsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('weekly');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, periodsRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/periods?type=${filterType}&year=${filterYear}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (periodsRes.ok) {
          const periodsData = await periodsRes.json();
          setPeriods(periodsData.periods || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filterType, filterYear]);

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

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header userName={user?.name} userRole={user?.role} hasSalesforce={user?.hasSalesforce} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-12 text-center">
            <p className="text-factory-text-muted">Only administrators can access this page.</p>
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
            <h1 className="text-2xl font-bold text-factory-text">Period Configuration</h1>
            <p className="text-sm text-factory-text-dim mt-1">Manage forecast periods and deadlines</p>
          </div>
          <button className="btn-primary">Create Period</button>
        </div>

        <div className="card mb-6 p-4">
          <div className="flex space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input w-40"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
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
          {periods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-factory-text-muted">No periods configured. Periods are auto-generated based on date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-factory-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">Date Range</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">Deadline</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-factory-text-muted uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period._id} className="border-b border-factory-border hover:bg-factory-hover">
                      <td className="px-4 py-3 font-mono text-factory-text">
                        {period.type === 'weekly' ? `W${period.value}` : `Q${period.value}`} {period.year}
                      </td>
                      <td className="px-4 py-3 text-sm text-factory-text-muted">
                        {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-factory-text-muted">
                        {period.submissionDeadline ? new Date(period.submissionDeadline).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${period.isLocked ? 'bg-factory-error/20 text-factory-error' : 'bg-factory-success/20 text-factory-success'}`}>
                          {period.isLocked ? 'Locked' : 'Open'}
                        </span>
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
