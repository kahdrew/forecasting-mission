'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PeriodSelector from '@/components/PeriodSelector';
import VarianceChart from '@/components/VarianceChart';
import { PeriodType } from '@/models/Period';

interface User {
  _id: string;
  name: string;
  role: string;
  hasSalesforce: boolean;
}

interface VarianceData {
  period: { type: string; year: number; value: number };
  previousTotal: number;
  currentTotal: number;
  change: number;
  changePercent: number;
}

interface AccuracyData {
  period: { type: string; year: number; value: number };
  forecastTotal: number;
  actualTotal: number;
  variance: number;
  accuracyPercent: number;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function AnalyticsPage() {
  const now = new Date();
  const [user, setUser] = useState<User | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [year, setYear] = useState(now.getFullYear());
  const [value, setValue] = useState(getWeekNumber(now));
  const [varianceData, setVarianceData] = useState<VarianceData[]>([]);
  const [accuracyData, setAccuracyData] = useState<AccuracyData[]>([]);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [userRes, varianceRes, accuracyRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch(`/api/analytics/variance?periodType=${periodType}&year=${year}&value=${value}&periods=8`),
          fetch(`/api/analytics/accuracy?periodType=${periodType}&year=${year}&periods=8`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (varianceRes.ok) {
          const data = await varianceRes.json();
          setVarianceData(data.variance || []);
        }

        if (accuracyRes.ok) {
          const data = await accuracyRes.json();
          setAccuracyData(data.accuracy || []);
          setAvgAccuracy(data.averageAccuracy || 0);
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
            <div className="h-64 bg-factory-card rounded-lg"></div>
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
            <p className="text-factory-text-muted">Analytics are only available for managers and above.</p>
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
            <h1 className="text-2xl font-bold text-factory-text">Analytics</h1>
            <p className="text-sm text-factory-text-dim mt-1">Variance and accuracy analysis</p>
          </div>
          <PeriodSelector
            periodType={periodType}
            selectedYear={year}
            selectedValue={value}
            onPeriodTypeChange={setPeriodType}
            onPeriodChange={(y, v) => { setYear(y); setValue(v); }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="stat-label">Average Accuracy</div>
            <div className={`stat-value ${avgAccuracy >= 90 ? 'text-factory-success' : avgAccuracy >= 75 ? 'text-factory-warning' : 'text-factory-error'}`}>
              {avgAccuracy.toFixed(1)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Periods Analyzed</div>
            <div className="stat-value">{accuracyData.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Latest Variance</div>
            <div className={`stat-value ${varianceData[0]?.change >= 0 ? 'text-factory-success' : 'text-factory-error'}`}>
              {varianceData[0]?.change >= 0 ? '+' : ''}${varianceData[0]?.change.toLocaleString() || 0}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-factory-text mb-4">Period-over-Period Variance</h2>
            {varianceData.length > 0 ? (
              <VarianceChart data={varianceData} height={300} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-factory-text-muted">
                No variance data available
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-factory-text mb-4">Forecast Accuracy</h2>
            {accuracyData.length > 0 ? (
              <div className="space-y-3">
                {accuracyData.map((item) => (
                  <div key={`${item.period.year}-${item.period.value}`} className="flex items-center justify-between p-3 bg-factory-bg rounded-lg">
                    <div>
                      <span className="font-mono text-sm text-factory-text">
                        {item.period.type === 'weekly' ? `W${item.period.value}` : `Q${item.period.value}`} {item.period.year}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs text-factory-text-dim">Forecast</div>
                        <div className="font-mono text-sm text-factory-text">${item.forecastTotal.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-factory-text-dim">Actual</div>
                        <div className="font-mono text-sm text-factory-text">${item.actualTotal.toLocaleString()}</div>
                      </div>
                      <div className={`w-16 text-right font-mono font-bold ${
                        item.accuracyPercent >= 90 ? 'text-factory-success' : 
                        item.accuracyPercent >= 75 ? 'text-factory-warning' : 'text-factory-error'
                      }`}>
                        {item.accuracyPercent.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-factory-text-muted">
                No accuracy data available
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
