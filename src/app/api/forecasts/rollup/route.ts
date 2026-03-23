import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canViewTeam } from '@/lib/auth';
import { calculateRollup, getTeamRollup } from '@/lib/rollup';
import { PeriodType } from '@/models/Forecast';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodType = (searchParams.get('periodType') || 'weekly') as PeriodType;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const value = parseInt(searchParams.get('value') || '1');
    const view = searchParams.get('view');

    const period = { type: periodType, year, value };

    if (view === 'team' && canViewTeam(user.role)) {
      const { team, totals } = await getTeamRollup(user._id.toString(), period);
      return NextResponse.json({ team, totals });
    }

    const rollup = await calculateRollup(user._id.toString(), period, canViewTeam(user.role));
    return NextResponse.json({ rollup });
  } catch (error) {
    console.error('Rollup error:', error);
    return NextResponse.json({ error: 'Failed to calculate rollup' }, { status: 500 });
  }
}
