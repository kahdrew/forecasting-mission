import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Forecast, PeriodType } from '@/models/Forecast';
import { getCurrentUser, canViewAnalytics } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { getAllDescendants } from '@/lib/rollup';

interface AccuracyData {
  period: { type: string; year: number; value: number };
  forecastTotal: number;
  actualTotal: number;
  variance: number;
  accuracyPercent: number;
}

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
    const periods = parseInt(searchParams.get('periods') || '8');

    const descendants = await getAllDescendants(user._id.toString());
    const userIds = [user._id.toString(), ...descendants].map(id => new mongoose.Types.ObjectId(id));

    const forecasts = await Forecast.find({
      repId: { $in: userIds },
      'period.type': periodType,
      'period.year': year,
      status: 'approved',
    }).lean();

    const periodMap = new Map<string, { forecast: number; actual: number }>();

    for (const forecast of forecasts) {
      const key = `${forecast.period.year}-${forecast.period.value}`;
      const existing = periodMap.get(key) || { forecast: 0, actual: 0 };

      const forecastTotal =
        forecast.categories.commit +
        forecast.categories.consumption +
        forecast.categories.bestCase +
        forecast.categories.services;

      const actualTotal = forecast.sfData?.amount || 0;

      existing.forecast += forecastTotal;
      existing.actual += actualTotal;
      periodMap.set(key, existing);
    }

    const accuracyData: AccuracyData[] = [];

    for (const [key, data] of periodMap) {
      const [periodYear, periodValue] = key.split('-').map(Number);
      const variance = data.actual - data.forecast;
      const accuracyPercent = data.forecast > 0
        ? Math.max(0, 100 - Math.abs((variance / data.forecast) * 100))
        : data.actual === 0 ? 100 : 0;

      accuracyData.push({
        period: { type: periodType, year: periodYear, value: periodValue },
        forecastTotal: data.forecast,
        actualTotal: data.actual,
        variance,
        accuracyPercent,
      });
    }

    accuracyData.sort((a, b) => {
      if (a.period.year !== b.period.year) return b.period.year - a.period.year;
      return b.period.value - a.period.value;
    });

    const limited = accuracyData.slice(0, periods);

    const avgAccuracy = limited.length > 0
      ? limited.reduce((sum, d) => sum + d.accuracyPercent, 0) / limited.length
      : 0;

    return NextResponse.json({
      accuracy: limited,
      averageAccuracy: avgAccuracy,
    });
  } catch (error) {
    console.error('Accuracy error:', error);
    return NextResponse.json({ error: 'Failed to calculate accuracy' }, { status: 500 });
  }
}
