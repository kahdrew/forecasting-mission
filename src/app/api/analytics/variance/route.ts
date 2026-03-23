import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Forecast, IForecast, PeriodType } from '@/models/Forecast';
import { getCurrentUser, canViewAnalytics } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateVariance, getTotalFromCategories, VarianceData } from '@/lib/history';
import { aggregateCategories, getAllDescendants } from '@/lib/rollup';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!canViewAnalytics(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const periodType = (searchParams.get('periodType') || 'weekly') as PeriodType;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const currentValue = parseInt(searchParams.get('value') || '1');
    const periods = parseInt(searchParams.get('periods') || '4');

    const descendants = await getAllDescendants(user._id.toString());
    const userIds = [user._id.toString(), ...descendants].map(id => new mongoose.Types.ObjectId(id));

    const varianceData: VarianceData[] = [];

    for (let i = 0; i < periods; i++) {
      let periodValue = currentValue - i;
      let periodYear = year;

      const maxValue = periodType === 'weekly' ? 52 : periodType === 'monthly' ? 12 : periodType === 'quarterly' ? 4 : 365;

      while (periodValue < 1) {
        periodYear--;
        periodValue += maxValue;
      }

      const prevValue = periodValue - 1 < 1 ? maxValue : periodValue - 1;
      const prevYear = periodValue - 1 < 1 ? periodYear - 1 : periodYear;

      const [currentForecasts, previousForecasts] = await Promise.all([
        Forecast.find({
          repId: { $in: userIds },
          'period.type': periodType,
          'period.year': periodYear,
          'period.value': periodValue,
        }).lean(),
        Forecast.find({
          repId: { $in: userIds },
          'period.type': periodType,
          'period.year': prevYear,
          'period.value': prevValue,
        }).lean(),
      ]);

      const currentCategories = aggregateCategories(currentForecasts as IForecast[]);
      const previousCategories = aggregateCategories(previousForecasts as IForecast[]);

      const currentTotal = getTotalFromCategories(currentCategories);
      const previousTotal = getTotalFromCategories(previousCategories);
      const change = currentTotal - previousTotal;
      const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

      varianceData.push({
        period: { type: periodType, year: periodYear, value: periodValue },
        previousTotal,
        currentTotal,
        change,
        changePercent,
        categoryChanges: calculateVariance(previousCategories, currentCategories),
      });
    }

    return NextResponse.json({ variance: varianceData });
  } catch (error) {
    console.error('Variance error:', error);
    return NextResponse.json({ error: 'Failed to calculate variance' }, { status: 500 });
  }
}
