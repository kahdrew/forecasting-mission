import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let user = await User.findOne({ email });

    if (user) {
      user.name = name;
      user.role = role || user.role;
      await user.save();
    } else {
      user = await User.create({
        email,
        name,
        sfUserId: `demo_${Date.now()}`,
        role: role || 'rep',
        managerId: null,
      });
    }

    const cookieStore = await cookies();
    cookieStore.set('userId', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true, user: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Demo auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
