import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getCurrentUser } from '@/lib/auth';
import { getForecastHistory } from '@/lib/history';

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

    const history = await getForecastHistory(id);

    return NextResponse.json({
      history: history.map(h => ({
        ...h,
        _id: h._id.toString(),
        forecastId: h.forecastId.toString(),
        userId: h.userId.toString(),
      })),
    });
  } catch (error) {
    console.error('Get forecast history error:', error);
    return NextResponse.json({ error: 'Failed to get forecast history' }, { status: 500 });
  }
}
