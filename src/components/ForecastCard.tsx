'use client';

import Link from 'next/link';

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

interface ForecastCardProps {
  forecast: Forecast;
}

export default function ForecastCard({ forecast }: ForecastCardProps) {
  const total =
    forecast.categories.commit +
    forecast.categories.consumption +
    forecast.categories.bestCase +
    forecast.categories.services;

  const statusStyles = {
    draft: 'badge-draft',
    submitted: 'badge-submitted',
    approved: 'badge-approved',
  };

  const matchTypeColors = {
    auto: 'border-l-factory-success',
    manual: 'border-l-factory-accent',
    unmatched: 'border-l-factory-warning',
  };

  return (
    <Link href={`/forecast/${forecast._id}`}>
      <div className={`card p-4 hover:bg-factory-hover transition-colors border-l-4 ${matchTypeColors[forecast.matchType]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-factory-text truncate">{forecast.accountName}</h3>
            {forecast.opportunityName && (
              <p className="text-sm text-factory-text-dim truncate">{forecast.opportunityName}</p>
            )}
          </div>
          <span className={`badge ${statusStyles[forecast.status]} ml-2 flex-shrink-0`}>
            {forecast.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-factory-text-dim">Commit</span>
            <span className="font-mono text-factory-success">${forecast.categories.commit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-factory-text-dim">Consumption</span>
            <span className="font-mono text-factory-accent">${forecast.categories.consumption.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-factory-text-dim">Best Case</span>
            <span className="font-mono text-factory-warning">${forecast.categories.bestCase.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-factory-text-dim">Services</span>
            <span className="font-mono text-purple-400">${forecast.categories.services.toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-factory-border flex items-center justify-between">
          <span className="text-sm text-factory-text-muted">Total</span>
          <span className="text-lg font-bold font-mono text-factory-text">${total.toLocaleString()}</span>
        </div>

        {forecast.sfData && (
          <div className="mt-2 pt-2 border-t border-factory-border text-xs text-factory-text-dim">
            <span>SF: ${forecast.sfData.amount.toLocaleString()}</span>
            <span className="mx-2">•</span>
            <span>{forecast.sfData.stage}</span>
            <span className="mx-2">•</span>
            <span>{forecast.sfData.probability}%</span>
          </div>
        )}
      </div>
    </Link>
  );
}
