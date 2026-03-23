import { NextRequest, NextResponse } from 'next/server';
import { PeriodConfig, PeriodType } from '@/models/Period';
import { getCurrentUser, canManagePeriods } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('type') as PeriodType | null;
    const year = searchParams.get('year');

    const query: Record<string, unknown> = {};
    if (periodType) query.type = periodType;
    if (year) query.year = parseInt(year);

    const periods = await PeriodConfig.find(query)
      .sort({ year: -1, value: -1 })
      .lean();

    return NextResponse.json({
      periods: periods.map(p => ({
        ...p,
        _id: p._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Get periods error:', error);
    return NextResponse.json({ error: 'Failed to get periods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!canManagePeriods(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { type, year, value, startDate, endDate, submissionDeadline } = body;

    if (!type || !year || !value || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Type, year, value, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const period = await PeriodConfig.create({
      type,
      year,
      value,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
      isLocked: false,
    });

    return NextResponse.json({
      period: {
        ...period.toObject(),
        _id: period._id.toString(),
      },
    });
  } catch (error) {
    console.error('Create period error:', error);
    return NextResponse.json({ error: 'Failed to create period' }, { status: 500 });
  }
}
