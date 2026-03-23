'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

function ConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [isDemo, setIsDemo] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('rep');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error('Demo login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-factory-bg">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-factory-accent rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-factory-text">Welcome to Forecast</h1>
          <p className="text-factory-text-muted mt-2">
            Enterprise sales forecasting with hierarchical rollups
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-factory-error/10 border border-factory-error/30 rounded-lg">
            <p className="text-sm text-factory-error">
              Authentication failed: {error.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        {!isDemo ? (
          <div className="space-y-4">
            <a
              href="/api/auth/salesforce"
              className="btn-primary w-full flex items-center justify-center space-x-3 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 3.5c-2.2 0-4.2 1.1-5.4 2.8-.4-.1-.8-.2-1.2-.2C3.2 6.1 1 8.3 1 11.1s2.2 5 4.9 5h.1c.8 1.6 2.4 2.8 4.3 2.8 1.2 0 2.3-.4 3.1-1.2.7.3 1.5.5 2.3.5 2.7 0 5-2.2 5-5 0-.3 0-.5-.1-.8 1.3-.9 2.1-2.3 2.1-4 0-2.7-2.2-4.9-4.9-4.9-.8 0-1.6.2-2.3.5-.9-1.4-2.5-2.5-4.5-2.5z"/>
              </svg>
              <span>Sign in with Salesforce</span>
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-factory-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-factory-bg text-factory-text-dim">or</span>
              </div>
            </div>

            <button
              onClick={() => setIsDemo(true)}
              className="btn-secondary w-full py-3"
            >
              Continue with Demo Mode
            </button>

            <div className="card p-4 mt-6">
              <h3 className="font-medium text-factory-text mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-factory-text-muted">
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-factory-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>4 forecast categories (Commit, Consumption, Best Case, Services)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-factory-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited hierarchy depth with rollups</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-factory-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Quota management with attainment tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-factory-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Manager adjustments with audit trail</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-factory-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Week-over-week variance analysis</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-factory-text mb-4">Demo Mode</h2>
            <form onSubmit={handleDemoLogin} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input"
                >
                  <option value="rep">Sales Rep</option>
                  <option value="manager">Manager</option>
                  <option value="director">Director</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDemo(false)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? 'Signing in...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-factory-bg">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-factory-card rounded-2xl w-16 mx-auto"></div>
            <div className="h-8 bg-factory-card rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-factory-card rounded-lg"></div>
          </div>
        </main>
      </div>
    }>
      <ConnectContent />
    </Suspense>
  );
}
