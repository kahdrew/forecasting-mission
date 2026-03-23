import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canViewTeam } from '@/lib/auth';
import { calculateQuarterlyRollup, getTeamQuarterlyRollup } from '@/lib/rollup';
import { getCurrentSubmissionAndTarget } from '@/lib/periods';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const current = getCurrentSubmissionAndTarget();
    
    // Target period (quarterly) - what the forecasts are for
    const targetQuarter = parseInt(searchParams.get('targetQuarter') || current.targetPeriod.quarter.toString());
    const targetYear = parseInt(searchParams.get('targetYear') || current.targetPeriod.year.toString());
    
    // Optional: filter by submission week
    const submissionWeek = searchParams.get('submissionWeek') ? parseInt(searchParams.get('submissionWeek')!) : undefined;
    const submissionYear = searchParams.get('submissionYear') ? parseInt(searchParams.get('submissionYear')!) : undefined;
    
    const view = searchParams.get('view');

    const targetPeriod = { quarter: targetQuarter, year: targetYear };
    const submissionPeriod = submissionWeek && submissionYear 
      ? { week: submissionWeek, year: submissionYear } 
      : undefined;

    if (view === 'team' && canViewTeam(user.role)) {
      const { team, totals } = await getTeamQuarterlyRollup(user._id.toString(), targetPeriod, submissionPeriod);
      return NextResponse.json({ team, totals, targetPeriod });
    }

    const rollup = await calculateQuarterlyRollup(user._id.toString(), targetPeriod, canViewTeam(user.role), submissionPeriod);
    return NextResponse.json({ rollup, targetPeriod });
  } catch (error) {
    console.error('Rollup error:', error);
    return NextResponse.json({ error: 'Failed to calculate rollup' }, { status: 500 });
  }
}
