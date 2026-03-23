'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  hasSalesforce: boolean;
  managerId: string | null;
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await fetch('/api/users/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }

        // For now, just show current user - would need an admin endpoint to list all users
        setUsers([]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-factory-card rounded w-1/4"></div>
            <div className="h-64 bg-factory-card rounded-lg"></div>
          </div>
        </main>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-factory-bg">
        <Header userName={currentUser?.name} userRole={currentUser?.role} hasSalesforce={currentUser?.hasSalesforce} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-12 text-center">
            <p className="text-factory-text-muted">Only administrators can access this page.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-factory-bg">
      <Header userName={currentUser?.name} userRole={currentUser?.role} hasSalesforce={currentUser?.hasSalesforce} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-factory-text">User Management</h1>
            <p className="text-sm text-factory-text-dim mt-1">Manage users, roles, and hierarchy</p>
          </div>
        </div>

        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-factory-card flex items-center justify-center">
            <svg className="w-8 h-8 text-factory-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-factory-text-muted mb-2">User management is synced from Salesforce.</p>
          <p className="text-sm text-factory-text-dim">User roles and hierarchy are determined by their Salesforce profile.</p>
        </div>
      </main>
    </div>
  );
}
