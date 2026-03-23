import { PeriodType } from '@/models/Period';

// Fiscal year starts February 1
const FISCAL_START_MONTH = 1; // 0-indexed (1 = February)

export interface Period {
  type: PeriodType;
  year: number;
  value: number;
  label: string;
  startDate: Date;
  endDate: Date;
}

// Get fiscal year for a given date (FY starts Feb 1)
export function getFiscalYear(date: Date): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  // If before February, we're in the previous fiscal year
  return month < FISCAL_START_MONTH ? year : year + 1;
}

// Get fiscal week number (1-52) based on Feb 1 fiscal year start
export function getWeekNumber(date: Date): number {
  const fiscalYear = getFiscalYear(date);
  const fiscalYearStart = getFiscalYearStart(fiscalYear);
  
  // Find the first Monday on or after fiscal year start
  const firstMonday = new Date(fiscalYearStart);
  const dayOfWeek = firstMonday.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
  firstMonday.setUTCDate(firstMonday.getUTCDate() + daysUntilMonday);
  
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const diffDays = Math.floor((d.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    // Date is before first Monday of fiscal year, belongs to last week of previous FY
    return 52;
  }
  
  return Math.min(52, Math.floor(diffDays / 7) + 1);
}

// Get fiscal year for a given date
export function getWeekYear(date: Date): number {
  return getFiscalYear(date);
}

// Get the start date of a fiscal year (Feb 1)
export function getFiscalYearStart(fiscalYear: number): Date {
  // FY26 starts Feb 1, 2025
  return new Date(Date.UTC(fiscalYear - 1, FISCAL_START_MONTH, 1));
}

// Get the end date of a fiscal year (Jan 31)
export function getFiscalYearEnd(fiscalYear: number): Date {
  // FY26 ends Jan 31, 2026
  return new Date(Date.UTC(fiscalYear, FISCAL_START_MONTH, 0));
}

export function getWeekStartDate(fiscalYear: number, week: number): Date {
  const fiscalYearStart = getFiscalYearStart(fiscalYear);
  
  // Find the first Monday on or after fiscal year start
  const firstMonday = new Date(fiscalYearStart);
  const dayOfWeek = firstMonday.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
  firstMonday.setUTCDate(firstMonday.getUTCDate() + daysUntilMonday);
  
  const weekStart = new Date(firstMonday);
  weekStart.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
  return weekStart;
}

export function getWeekEndDate(fiscalYear: number, week: number): Date {
  const start = getWeekStartDate(fiscalYear, week);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return end;
}

// Fiscal month: 1 = February, 2 = March, ..., 12 = January
export function getFiscalMonth(date: Date): number {
  const month = date.getMonth(); // 0-indexed
  // Feb=0 in fiscal, Jan=11 in fiscal
  // Calendar: Jan=0, Feb=1, Mar=2, ..., Dec=11
  // Fiscal:   Jan=12, Feb=1, Mar=2, ..., Dec=11
  return month === 0 ? 12 : month;
}

export function getMonthStartDate(fiscalYear: number, fiscalMonth: number): Date {
  // Fiscal month 1 = Feb, 2 = Mar, ..., 11 = Dec, 12 = Jan
  // FY26 month 1 = Feb 2025, FY26 month 12 = Jan 2026
  const calendarYear = fiscalMonth === 12 ? fiscalYear : fiscalYear - 1;
  const calendarMonth = fiscalMonth === 12 ? 0 : fiscalMonth; // 0-indexed
  return new Date(Date.UTC(calendarYear, calendarMonth, 1));
}

export function getMonthEndDate(fiscalYear: number, fiscalMonth: number): Date {
  const calendarYear = fiscalMonth === 12 ? fiscalYear : fiscalYear - 1;
  const calendarMonth = fiscalMonth === 12 ? 0 : fiscalMonth;
  return new Date(Date.UTC(calendarYear, calendarMonth + 1, 0));
}

// Fiscal quarters: Q1 = Feb-Apr, Q2 = May-Jul, Q3 = Aug-Oct, Q4 = Nov-Jan
export function getFiscalQuarter(date: Date): number {
  const fiscalMonth = getFiscalMonth(date);
  return Math.ceil(fiscalMonth / 3);
}

export function getQuarterStartDate(fiscalYear: number, quarter: number): Date {
  const firstFiscalMonth = (quarter - 1) * 3 + 1; // Q1=1, Q2=4, Q3=7, Q4=10
  return getMonthStartDate(fiscalYear, firstFiscalMonth);
}

export function getQuarterEndDate(fiscalYear: number, quarter: number): Date {
  const lastFiscalMonth = quarter * 3; // Q1=3, Q2=6, Q3=9, Q4=12
  return getMonthEndDate(fiscalYear, lastFiscalMonth);
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
  const fiscalYear = getFiscalYear(now);
  
  switch (type) {
    case 'daily': {
      const dayOfYear = getDayOfYear(now);
      return {
        type: 'daily',
        year: fiscalYear,
        value: dayOfYear,
        label: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        startDate: getDayStartDate(now.getFullYear(), dayOfYear),
        endDate: getDayStartDate(now.getFullYear(), dayOfYear),
      };
    }
    case 'weekly': {
      const week = getWeekNumber(now);
      const start = getWeekStartDate(fiscalYear, week);
      const end = getWeekEndDate(fiscalYear, week);
      return {
        type: 'weekly',
        year: fiscalYear,
        value: week,
        label: `FY${fiscalYear} W${week}`,
        startDate: start,
        endDate: end,
      };
    }
    case 'monthly': {
      const fiscalMonth = getFiscalMonth(now);
      const monthNames = ['', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      return {
        type: 'monthly',
        year: fiscalYear,
        value: fiscalMonth,
        label: `FY${fiscalYear} ${monthNames[fiscalMonth]}`,
        startDate: getMonthStartDate(fiscalYear, fiscalMonth),
        endDate: getMonthEndDate(fiscalYear, fiscalMonth),
      };
    }
    case 'quarterly': {
      const quarter = getFiscalQuarter(now);
      return {
        type: 'quarterly',
        year: fiscalYear,
        value: quarter,
        label: `FY${fiscalYear} Q${quarter}`,
        startDate: getQuarterStartDate(fiscalYear, quarter),
        endDate: getQuarterEndDate(fiscalYear, quarter),
      };
    }
  }
}

export function getPeriodLabel(type: PeriodType, fiscalYear: number, value: number): string {
  switch (type) {
    case 'daily': {
      const date = getDayStartDate(fiscalYear - 1, value);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    case 'weekly':
      return `FY${fiscalYear} W${value}`;
    case 'monthly': {
      const monthNames = ['', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      return `FY${fiscalYear} ${monthNames[value]}`;
    }
    case 'quarterly':
      return `FY${fiscalYear} Q${value}`;
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
