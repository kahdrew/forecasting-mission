import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Quota } from '@/models/Quota';
import { User } from '@/models/User';
import { getCurrentUser, canManageQuotas } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

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
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('periodType');
    const year = searchParams.get('year');

    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(id) };
    if (periodType) query['period.type'] = periodType;
    if (year) query['period.year'] = parseInt(year);

    const quotas = await Quota.find(query)
      .sort({ 'period.year': -1, 'period.value': -1 })
      .lean();

    return NextResponse.json({
      quotas: quotas.map(q => ({
        ...q,
        _id: q._id.toString(),
        userId: q.userId.toString(),
        createdBy: q.createdBy.toString(),
      })),
    });
  } catch (error) {
    console.error('Get quotas error:', error);
    return NextResponse.json({ error: 'Failed to get quotas' }, { status: 500 });
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

    if (!canManageQuotas(user.role)) {
      return NextResponse.json({ error: 'Not authorized to manage quotas' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectToDatabase();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { period, amount } = body;

    if (!period || amount === undefined) {
      return NextResponse.json(
        { error: 'Period and amount are required' },
        { status: 400 }
      );
    }

    const quota = await Quota.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(id),
        'period.type': period.type,
        'period.year': period.year,
        'period.value': period.value,
      },
      {
        userId: new mongoose.Types.ObjectId(id),
        userName: targetUser.name,
        period,
        amount,
        createdBy: user._id,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      quota: {
        ...quota.toObject(),
        _id: quota._id.toString(),
        userId: quota.userId.toString(),
        createdBy: quota.createdBy.toString(),
      },
    });
  } catch (error) {
    console.error('Update quota error:', error);
    return NextResponse.json({ error: 'Failed to update quota' }, { status: 500 });
  }
}
