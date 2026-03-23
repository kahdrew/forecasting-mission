import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Forecast, PeriodType } from '@/models/Forecast';
import { getCurrentUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { createHistoryEntry } from '@/lib/history';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('periodType') as PeriodType | null;
    const year = searchParams.get('year');
    const value = searchParams.get('value');
    const status = searchParams.get('status');
    const repId = searchParams.get('repId');

    const query: Record<string, unknown> = {};

    if (repId) {
      query.repId = new mongoose.Types.ObjectId(repId);
    } else if (user.role === 'rep') {
      query.repId = user._id;
    }

    if (periodType) query['period.type'] = periodType;
    if (year) query['period.year'] = parseInt(year);
    if (value) query['period.value'] = parseInt(value);
    if (status) query.status = status;

    const forecasts = await Forecast.find(query)
      .sort({ 'period.year': -1, 'period.value': -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      forecasts: forecasts.map(f => ({
        ...f,
        _id: f._id.toString(),
        repId: f.repId.toString(),
        approvedBy: f.approvedBy?.toString() || null,
      })),
    });
  } catch (error) {
    console.error('Get forecasts error:', error);
    return NextResponse.json({ error: 'Failed to get forecasts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      opportunityId,
      opportunityName,
      accountName,
      period,
      categories,
      sfData,
      matchType,
    } = body;

    if (!accountName || !period) {
      return NextResponse.json(
        { error: 'Account name and period are required' },
        { status: 400 }
      );
    }

    const forecast = await Forecast.create({
      opportunityId: opportunityId || null,
      opportunityName: opportunityName || null,
      accountName,
      repId: user._id,
      repName: user.name,
      period,
      categories: categories || { commit: 0, consumption: 0, bestCase: 0, services: 0 },
      sfData: sfData || null,
      matchType: matchType || 'unmatched',
      status: 'draft',
    });

    await createHistoryEntry({
      forecastId: forecast._id.toString(),
      userId: user._id.toString(),
      userName: user.name,
      previousCategories: null,
      newCategories: forecast.categories,
      changeType: 'create',
    });

    return NextResponse.json({
      forecast: {
        ...forecast.toObject(),
        _id: forecast._id.toString(),
        repId: forecast.repId.toString(),
      },
    });
  } catch (error) {
    console.error('Create forecast error:', error);
    return NextResponse.json({ error: 'Failed to create forecast' }, { status: 500 });
  }
}
