'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  hasSalesforce?: boolean;
}

export default function Header({ userName, userRole, hasSalesforce }: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/forecast/new', label: 'New Forecast' },
    { href: '/team', label: 'Team', roles: ['manager', 'director', 'admin'] },
    { href: '/analytics', label: 'Analytics', roles: ['manager', 'director', 'admin'] },
    { href: '/opportunities', label: 'Opportunities' },
    { href: '/history', label: 'History' },
  ];

  const adminItems = [
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/periods', label: 'Periods' },
    { href: '/admin/quotas', label: 'Quotas' },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <header className="bg-factory-card border-b border-factory-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-factory-accent rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-factory-text">Forecast</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-factory-accent/10 text-factory-accent'
                      : 'text-factory-text-muted hover:text-factory-text hover:bg-factory-hover'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {userRole === 'admin' && (
                <div className="relative group">
                  <button className="px-3 py-2 rounded-lg text-sm font-medium text-factory-text-muted hover:text-factory-text hover:bg-factory-hover flex items-center space-x-1">
                    <span>Admin</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-1 w-40 bg-factory-card border border-factory-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {adminItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-factory-text-muted hover:text-factory-text hover:bg-factory-hover first:rounded-t-lg last:rounded-b-lg"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {hasSalesforce !== undefined && (
              <div className={`flex items-center space-x-1.5 text-xs ${hasSalesforce ? 'text-factory-success' : 'text-factory-text-dim'}`}>
                <div className={`w-2 h-2 rounded-full ${hasSalesforce ? 'bg-factory-success' : 'bg-factory-text-dim'}`} />
                <span>{hasSalesforce ? 'SF Connected' : 'SF Disconnected'}</span>
              </div>
            )}

            {userName && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-factory-text">{userName}</div>
                  {userRole && (
                    <div className="text-xs text-factory-text-dim capitalize">{userRole}</div>
                  )}
                </div>
                <div className="w-9 h-9 rounded-full bg-factory-accent/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-factory-accent">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {!userName && (
              <Link href="/connect" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
