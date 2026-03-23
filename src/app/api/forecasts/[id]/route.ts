import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Forecast } from '@/models/Forecast';
import { getCurrentUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { createHistoryEntry } from '@/lib/history';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid forecast ID' }, { status: 400 });
    }

    await connectToDatabase();

    const forecast = await Forecast.findById(id).lean();

    if (!forecast) {
      return NextResponse.json({ error: 'Forecast not found' }, { status: 404 });
    }

    return NextResponse.json({
      forecast: {
        ...forecast,
        _id: forecast._id.toString(),
        repId: forecast.repId.toString(),
        approvedBy: forecast.approvedBy?.toString() || null,
      },
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    return NextResponse.json({ error: 'Failed to get forecast' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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

    if (forecast.repId.toString() !== user._id.toString() && user.role === 'rep') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (forecast.status !== 'draft' && user.role === 'rep') {
      return NextResponse.json(
        { error: 'Cannot edit submitted forecast' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { categories, status } = body;

    const previousCategories = { ...forecast.categories };

    if (categories) {
      forecast.categories = categories;
    }

    if (status === 'submitted' && forecast.status === 'draft') {
      forecast.status = 'submitted';
      forecast.submittedAt = new Date();

      await createHistoryEntry({
        forecastId: forecast._id.toString(),
        userId: user._id.toString(),
        userName: user.name,
        previousCategories,
        newCategories: forecast.categories,
        changeType: 'submit',
      });
    } else if (categories) {
      await createHistoryEntry({
        forecastId: forecast._id.toString(),
        userId: user._id.toString(),
        userName: user.name,
        previousCategories,
        newCategories: forecast.categories,
        changeType: 'update',
      });
    }

    await forecast.save();

    return NextResponse.json({
      forecast: {
        ...forecast.toObject(),
        _id: forecast._id.toString(),
        repId: forecast.repId.toString(),
        approvedBy: forecast.approvedBy?.toString() || null,
      },
    });
  } catch (error) {
    console.error('Update forecast error:', error);
    return NextResponse.json({ error: 'Failed to update forecast' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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

    if (forecast.repId.toString() !== user._id.toString() && user.role === 'rep') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (forecast.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot delete submitted forecast' },
        { status: 400 }
      );
    }

    await Forecast.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete forecast error:', error);
    return NextResponse.json({ error: 'Failed to delete forecast' }, { status: 500 });
  }
}
