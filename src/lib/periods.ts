import { PeriodType } from '@/models/Period';

export interface Period {
  type: PeriodType;
  year: number;
  value: number;
  label: string;
  startDate: Date;
  endDate: Date;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

export function getWeekStartDate(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const weekStart = new Date(firstMonday);
  weekStart.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
  return weekStart;
}

export function getWeekEndDate(year: number, week: number): Date {
  const start = getWeekStartDate(year, week);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return end;
}

export function getMonthStartDate(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

export function getMonthEndDate(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

export function getQuarterStartDate(year: number, quarter: number): Date {
  const month = (quarter - 1) * 3;
  return new Date(Date.UTC(year, month, 1));
}

export function getQuarterEndDate(year: number, quarter: number): Date {
  const month = quarter * 3;
  return new Date(Date.UTC(year, month, 0));
}

export function getDayStartDate(year: number, dayOfYear: number): Date {
  const date = new Date(Date.UTC(year, 0, 1));
  date.setUTCDate(dayOfYear);
  return date;
}

export function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getCurrentPeriod(type: PeriodType): Period {
  const now = new Date();
  const year = now.getFullYear();
  
  switch (type) {
    case 'daily': {
      const dayOfYear = getDayOfYear(now);
      return {
        type: 'daily',
        year,
        value: dayOfYear,
        label: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        startDate: getDayStartDate(year, dayOfYear),
        endDate: getDayStartDate(year, dayOfYear),
      };
    }
    case 'weekly': {
      const week = getWeekNumber(now);
      const weekYear = getWeekYear(now);
      const start = getWeekStartDate(weekYear, week);
      const end = getWeekEndDate(weekYear, week);
      return {
        type: 'weekly',
        year: weekYear,
        value: week,
        label: `W${week} ${weekYear}`,
        startDate: start,
        endDate: end,
      };
    }
    case 'monthly': {
      const month = now.getMonth() + 1;
      return {
        type: 'monthly',
        year,
        value: month,
        label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startDate: getMonthStartDate(year, month),
        endDate: getMonthEndDate(year, month),
      };
    }
    case 'quarterly': {
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      return {
        type: 'quarterly',
        year,
        value: quarter,
        label: `Q${quarter} ${year}`,
        startDate: getQuarterStartDate(year, quarter),
        endDate: getQuarterEndDate(year, quarter),
      };
    }
  }
}

export function getPeriodLabel(type: PeriodType, year: number, value: number): string {
  switch (type) {
    case 'daily': {
      const date = getDayStartDate(year, value);
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
}

export function getPeriodsAround(type: PeriodType, count: number = 4): Period[] {
  const current = getCurrentPeriod(type);
  const periods: Period[] = [];
  
  for (let i = -count; i <= count; i++) {
    let year = current.year;
    let value = current.value + i;
    
    switch (type) {
      case 'daily':
        if (value < 1) {
          year--;
          value = 365 + value;
        } else if (value > 365) {
          year++;
          value = value - 365;
        }
        periods.push({
          type,
          year,
          value,
          label: getPeriodLabel(type, year, value),
          startDate: getDayStartDate(year, value),
          endDate: getDayStartDate(year, value),
        });
        break;
      case 'weekly':
        if (value < 1) {
          year--;
          value = 52 + value;
        } else if (value > 52) {
          year++;
          value = value - 52;
        }
        periods.push({
          type,
          year,
          value,
          label: getPeriodLabel(type, year, value),
          startDate: getWeekStartDate(year, value),
          endDate: getWeekEndDate(year, value),
        });
        break;
      case 'monthly':
        if (value < 1) {
          year--;
          value = 12 + value;
        } else if (value > 12) {
          year++;
          value = value - 12;
        }
        periods.push({
          type,
          year,
          value,
          label: getPeriodLabel(type, year, value),
          startDate: getMonthStartDate(year, value),
          endDate: getMonthEndDate(year, value),
        });
        break;
      case 'quarterly':
        if (value < 1) {
          year--;
          value = 4 + value;
        } else if (value > 4) {
          year++;
          value = value - 4;
        }
        periods.push({
          type,
          year,
          value,
          label: getPeriodLabel(type, year, value),
          startDate: getQuarterStartDate(year, value),
          endDate: getQuarterEndDate(year, value),
        });
        break;
    }
  }
  
  return periods;
}
