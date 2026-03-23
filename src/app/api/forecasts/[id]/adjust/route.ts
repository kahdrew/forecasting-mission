import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Forecast } from '@/models/Forecast';
import { getCurrentUser, canAdjustForecasts } from '@/lib/auth';
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

    if (!canAdjustForecasts(user.role)) {
      return NextResponse.json({ error: 'Not authorized to adjust forecasts' }, { status: 403 });
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

    const body = await request.json();
    const { categories, reason } = body;

    if (!categories || !reason) {
      return NextResponse.json(
        { error: 'Categories and reason are required' },
        { status: 400 }
      );
    }

    const previousCategories = forecast.adjustments.length > 0
      ? forecast.adjustments[forecast.adjustments.length - 1].categories
      : forecast.categories;

    forecast.adjustments.push({
      managerId: user._id,
      managerName: user.name,
      categories,
      reason,
      createdAt: new Date(),
    });

    await forecast.save();

    await createHistoryEntry({
      forecastId: forecast._id.toString(),
      userId: user._id.toString(),
      userName: user.name,
      previousCategories,
      newCategories: categories,
      changeType: 'adjust',
      reason,
      metadata: { adjustmentIndex: forecast.adjustments.length - 1 },
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
    console.error('Adjust forecast error:', error);
    return NextResponse.json({ error: 'Failed to adjust forecast' }, { status: 500 });
  }
}
