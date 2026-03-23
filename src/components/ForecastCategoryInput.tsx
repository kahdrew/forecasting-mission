'use client';

interface ForecastCategories {
  commit: number;
  consumption: number;
  bestCase: number;
  services: number;
}

interface ForecastCategoryInputProps {
  categories: ForecastCategories;
  onChange: (categories: ForecastCategories) => void;
  disabled?: boolean;
}

export default function ForecastCategoryInput({
  categories,
  onChange,
  disabled = false,
}: ForecastCategoryInputProps) {
  const categoryConfig = [
    { key: 'commit', label: 'Commit', color: 'factory-success', description: 'High confidence deals' },
    { key: 'consumption', label: 'Consumption', color: 'factory-accent', description: 'Usage-based revenue' },
    { key: 'bestCase', label: 'Best Case', color: 'factory-warning', description: 'Optimistic scenario' },
    { key: 'services', label: 'Services', color: 'purple-400', description: 'Professional services' },
  ] as const;

  const handleChange = (key: keyof ForecastCategories, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({ ...categories, [key]: numValue });
  };

  const total = categories.commit + categories.consumption + categories.bestCase + categories.services;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryConfig.map(({ key, label, color, description }) => (
          <div key={key} className="relative">
            <label className="label flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full bg-${color}`} />
                <span>{label}</span>
              </span>
              <span className="text-xs text-factory-text-dim">{description}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-factory-text-muted">$</span>
              <input
                type="number"
                value={categories[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={disabled}
                placeholder="0"
                className="input pl-7 font-mono text-right disabled:bg-factory-bg disabled:text-factory-text-dim"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-factory-border flex items-center justify-between">
        <span className="text-sm font-medium text-factory-text-muted">Total Forecast</span>
        <span className="text-2xl font-bold font-mono text-factory-text">
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
