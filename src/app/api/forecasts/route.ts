import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Forecast } from '@/models/Forecast';
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
    // Submission period (weekly) filters
    const submissionWeek = searchParams.get('submissionWeek');
    const submissionYear = searchParams.get('submissionYear');
    // Target period (quarterly) filters
    const targetQuarter = searchParams.get('targetQuarter');
    const targetYear = searchParams.get('targetYear');
    const status = searchParams.get('status');
    const repId = searchParams.get('repId');

    const query: Record<string, unknown> = {};

    if (repId) {
      query.repId = new mongoose.Types.ObjectId(repId);
    } else if (user.role === 'rep') {
      query.repId = user._id;
    }

    // Filter by submission period (when entered)
    if (submissionWeek) query['submissionPeriod.week'] = parseInt(submissionWeek);
    if (submissionYear) query['submissionPeriod.year'] = parseInt(submissionYear);
    
    // Filter by target period (what quarter it's for)
    if (targetQuarter) query['targetPeriod.quarter'] = parseInt(targetQuarter);
    if (targetYear) query['targetPeriod.year'] = parseInt(targetYear);
    
    if (status) query.status = status;

    const forecasts = await Forecast.find(query)
      .sort({ 'submissionPeriod.year': -1, 'submissionPeriod.week': -1, createdAt: -1 })
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
      submissionPeriod,
      targetPeriod,
      categories,
      sfData,
      matchType,
    } = body;

    if (!accountName || !submissionPeriod || !targetPeriod) {
      return NextResponse.json(
        { error: 'Account name, submission period, and target period are required' },
        { status: 400 }
      );
    }

    // Legacy period field for backwards compatibility
    const period = {
      type: 'weekly' as const,
      year: submissionPeriod.year,
      value: submissionPeriod.week,
    };

    const forecast = await Forecast.create({
      opportunityId: opportunityId || null,
      opportunityName: opportunityName || null,
      accountName,
      repId: user._id,
      repName: user.name,
      period,
      submissionPeriod,
      targetPeriod,
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
