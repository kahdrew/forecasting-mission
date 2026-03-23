import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDirectReports, getAllDescendants } from '@/lib/rollup';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const manager = user.managerId 
      ? await User.findById(user.managerId).lean()
      : null;

    const directReports = await getDirectReports(user._id.toString());
    const allDescendants = await getAllDescendants(user._id.toString());

    return NextResponse.json({
      manager: manager ? {
        _id: manager._id.toString(),
        name: manager.name,
        role: manager.role,
      } : null,
      directReports: directReports.map(r => ({
        _id: r._id.toString(),
        name: r.name,
        email: r.email,
        role: r.role,
      })),
      teamSize: allDescendants.length,
    });
  } catch (error) {
    console.error('Hierarchy error:', error);
    return NextResponse.json({ error: 'Failed to get hierarchy' }, { status: 500 });
  }
}
