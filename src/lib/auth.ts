import { cookies } from 'next/headers';
import { User, IUser } from '@/models/User';
import { connectToDatabase } from './mongodb';

export async function getCurrentUser(): Promise<IUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(userId).lean();
  return user as IUser | null;
}

export async function requireAuth(): Promise<IUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function canViewTeam(userRole: string): boolean {
  return ['manager', 'director', 'admin'].includes(userRole);
}

export function canApproveForecasts(userRole: string): boolean {
  return ['manager', 'director', 'admin'].includes(userRole);
}

export function canAdjustForecasts(userRole: string): boolean {
  return ['manager', 'director', 'admin'].includes(userRole);
}

export function canManageUsers(userRole: string): boolean {
  return userRole === 'admin';
}

export function canManagePeriods(userRole: string): boolean {
  return userRole === 'admin';
}

export function canManageQuotas(userRole: string): boolean {
  return ['director', 'admin'].includes(userRole);
}

export function canViewAnalytics(userRole: string): boolean {
  return ['manager', 'director', 'admin'].includes(userRole);
}

export interface LeanUser {
  _id: string;
  email: string;
  name: string;
  sfUserId: string;
  role: string;
  managerId: string | null;
  hasSalesforce: boolean;
}

export function sanitizeUser(user: IUser): LeanUser {
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    sfUserId: user.sfUserId,
    role: user.role,
    managerId: user.managerId?.toString() || null,
    hasSalesforce: !!user.salesforce,
  };
}
