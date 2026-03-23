import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOAuth2, fetchUserInfo } from '@/lib/salesforce';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import jsforce from 'jsforce';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/connect?error=' + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/connect?error=no_code', request.url));
  }

  try {
    const oauth2 = getOAuth2();
    const conn = new jsforce.Connection({ oauth2 });
    
    await conn.authorize(code);

    const userInfo = await fetchUserInfo(conn);
    const tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await connectToDatabase();

    let user = await User.findOne({ sfUserId: userInfo.id });

    if (user) {
      user.salesforce = {
        userId: userInfo.id,
        accessToken: conn.accessToken!,
        refreshToken: conn.refreshToken!,
        instanceUrl: conn.instanceUrl,
        tokenExpiresAt,
      };
      user.name = userInfo.name;
      user.email = userInfo.email;
      await user.save();
    } else {
      user = await User.create({
        email: userInfo.email,
        name: userInfo.name,
        sfUserId: userInfo.id,
        role: 'rep',
        managerId: null,
        salesforce: {
          userId: userInfo.id,
          accessToken: conn.accessToken!,
          refreshToken: conn.refreshToken!,
          instanceUrl: conn.instanceUrl,
          tokenExpiresAt,
        },
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

    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    console.error('Salesforce auth error:', err);
    return NextResponse.redirect(new URL('/connect?error=auth_failed', request.url));
  }
}
