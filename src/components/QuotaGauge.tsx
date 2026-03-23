'use client';

interface QuotaGaugeProps {
  forecast: number;
  quota: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuotaGauge({ forecast, quota, label, size = 'md' }: QuotaGaugeProps) {
  const attainment = quota > 0 ? (forecast / quota) * 100 : 0;
  const coverage = quota > 0 ? forecast / quota : 0;

  const getColor = (percent: number): string => {
    if (percent >= 100) return 'text-factory-success';
    if (percent >= 75) return 'text-factory-warning';
    return 'text-factory-error';
  };

  const getBgColor = (percent: number): string => {
    if (percent >= 100) return 'bg-factory-success';
    if (percent >= 75) return 'bg-factory-warning';
    return 'bg-factory-error';
  };

  const sizeClasses = {
    sm: { container: 'w-24 h-24', text: 'text-lg', label: 'text-xs' },
    md: { container: 'w-32 h-32', text: 'text-2xl', label: 'text-sm' },
    lg: { container: 'w-40 h-40', text: 'text-3xl', label: 'text-base' },
  };

  const strokeWidth = size === 'sm' ? 6 : size === 'md' ? 8 : 10;
  const radius = size === 'sm' ? 40 : size === 'md' ? 52 : 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(attainment, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size].container}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-factory-border"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={getBgColor(attainment)}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold font-mono ${sizeClasses[size].text} ${getColor(attainment)}`}>
            {attainment.toFixed(0)}%
          </span>
          {label && (
            <span className={`text-factory-text-dim ${sizeClasses[size].label}`}>{label}</span>
          )}
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm text-factory-text-muted">
          ${forecast.toLocaleString()} / ${quota.toLocaleString()}
        </div>
        <div className="text-xs text-factory-text-dim">
          Coverage: {coverage.toFixed(2)}x
        </div>
      </div>
    </div>
  );
}
