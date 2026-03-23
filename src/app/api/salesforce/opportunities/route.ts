import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getConnectionForUser, fetchOpportunities } from '@/lib/salesforce';
import { Opportunity } from '@/models/Opportunity';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const sync = searchParams.get('sync') === 'true';

    if (sync && user.salesforce) {
      const conn = await getConnectionForUser(user._id.toString());
      if (conn) {
        try {
          const sfOpportunities = await fetchOpportunities(conn, query);

          for (const opp of sfOpportunities) {
            await Opportunity.findOneAndUpdate(
              { sfId: opp.Id, userId: user._id },
              {
                sfId: opp.Id,
                userId: user._id,
                name: opp.Name,
                accountName: opp.AccountName,
                amount: opp.Amount,
                stageName: opp.StageName,
                closeDate: new Date(opp.CloseDate),
                probability: opp.Probability,
                forecastCategory: opp.ForecastCategory,
                ownerId: opp.OwnerId,
                ownerName: opp.OwnerName,
                lastSyncedAt: new Date(),
              },
              { upsert: true, new: true }
            );
          }
        } catch (err) {
          console.error('Failed to sync from Salesforce:', err);
        }
      }
    }

    const filter: Record<string, unknown> = { userId: user._id };
    if (query) {
      filter.$text = { $search: query };
    }

    const opportunities = await Opportunity.find(filter)
      .sort({ closeDate: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      opportunities: opportunities.map(o => ({
        ...o,
        _id: o._id.toString(),
        userId: o.userId.toString(),
      })),
    });
  } catch (error) {
    console.error('Fetch opportunities error:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}
