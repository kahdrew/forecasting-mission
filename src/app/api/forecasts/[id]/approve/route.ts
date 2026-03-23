import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Forecast } from '@/models/Forecast';
import { getCurrentUser, canApproveForecasts } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { createHistoryEntry } from '@/lib/history';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!canApproveForecasts(user.role)) {
      return NextResponse.json({ error: 'Not authorized to approve forecasts' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid forecast ID' }, { status: 400 });
    }

    await connectToDatabase();

    const forecast = await Forecast.findById(id);

    if (!forecast) {
      return NextResponse.json({ error: 'Forecast not found' }, { status: 404 });
    }

    if (forecast.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Can only approve submitted forecasts' },
        { status: 400 }
      );
    }

    forecast.status = 'approved';
    forecast.approvedAt = new Date();
    forecast.approvedBy = user._id;

    await forecast.save();

    await createHistoryEntry({
      forecastId: forecast._id.toString(),
      userId: user._id.toString(),
      userName: user.name,
      previousCategories: forecast.categories,
      newCategories: forecast.categories,
      changeType: 'approve',
      metadata: { approvedBy: user.name },
    });

    return NextResponse.json({
      forecast: {
        ...forecast.toObject(),
        _id: forecast._id.toString(),
        repId: forecast.repId.toString(),
        approvedBy: forecast.approvedBy?.toString() || null,
      },
    });
  } catch (error) {
    console.error('Approve forecast error:', error);
    return NextResponse.json({ error: 'Failed to approve forecast' }, { status: 500 });
  }
}
