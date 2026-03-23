'use client';

import { useState } from 'react';
import { PeriodType } from '@/models/Period';

interface PeriodSelectorProps {
  periodType: PeriodType;
  selectedYear: number;
  selectedValue: number;
  onPeriodTypeChange?: (type: PeriodType) => void;
  onPeriodChange: (year: number, value: number) => void;
  showTypeSelector?: boolean;
}

export default function PeriodSelector({
  periodType,
  selectedYear,
  selectedValue,
  onPeriodTypeChange,
  onPeriodChange,
  showTypeSelector = true,
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getMaxValue = (type: PeriodType): number => {
    switch (type) {
      case 'daily': return 365;
      case 'weekly': return 52;
      case 'monthly': return 12;
      case 'quarterly': return 4;
    }
  };

  const getLabel = (type: PeriodType, year: number, value: number): string => {
    switch (type) {
      case 'daily': {
        const date = new Date(year, 0, value);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      case 'weekly':
        return `W${value} ${year}`;
      case 'monthly': {
        const date = new Date(year, value - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      case 'quarterly':
        return `Q${value} ${year}`;
    }
  };

  const generateOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const maxValue = getMaxValue(periodType);

    for (let y = currentYear + 1; y >= currentYear - 1; y--) {
      for (let v = maxValue; v >= 1; v--) {
        options.push({ year: y, value: v, label: getLabel(periodType, y, v) });
      }
    }

    return options.slice(0, 50);
  };

  const options = generateOptions();
  const currentLabel = getLabel(periodType, selectedYear, selectedValue);

  const handlePrev = () => {
    let newValue = selectedValue - 1;
    let newYear = selectedYear;
    if (newValue < 1) {
      newYear--;
      newValue = getMaxValue(periodType);
    }
    onPeriodChange(newYear, newValue);
  };

  const handleNext = () => {
    const maxValue = getMaxValue(periodType);
    let newValue = selectedValue + 1;
    let newYear = selectedYear;
    if (newValue > maxValue) {
      newYear++;
      newValue = 1;
    }
    onPeriodChange(newYear, newValue);
  };

  return (
    <div className="flex items-center space-x-3">
      {showTypeSelector && onPeriodTypeChange && (
        <select
          value={periodType}
          onChange={(e) => onPeriodTypeChange(e.target.value as PeriodType)}
          className="input w-32 text-sm"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      )}

      <div className="flex items-center">
        <button
          onClick={handlePrev}
          className="p-2 hover:bg-factory-hover rounded-l-lg border border-factory-border text-factory-text-muted hover:text-factory-text transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 min-w-[160px] bg-factory-card border-y border-factory-border text-sm font-medium text-factory-text hover:bg-factory-hover transition-colors flex items-center justify-between"
          >
            <span className="font-mono">{currentLabel}</span>
            <svg className="w-4 h-4 ml-2 text-factory-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-factory-card border border-factory-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
              {options.map((opt) => (
                <button
                  key={`${opt.year}-${opt.value}`}
                  onClick={() => {
                    onPeriodChange(opt.year, opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    opt.year === selectedYear && opt.value === selectedValue
                      ? 'bg-factory-accent/10 text-factory-accent'
                      : 'text-factory-text hover:bg-factory-hover'
                  }`}
                >
                  <span className="font-mono">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleNext}
          className="p-2 hover:bg-factory-hover rounded-r-lg border border-factory-border text-factory-text-muted hover:text-factory-text transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
