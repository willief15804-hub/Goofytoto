'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/attendance', label: 'Sessions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/skills', label: 'Skills', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/players', label: 'Players', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/calendar', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/history', label: 'History', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const mobileLinks = links.slice(0, 5);

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="hidden lg:block sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 font-heading font-extrabold text-xl" style={{ color: 'var(--dark)' }}>
              <span className="w-9 h-9 rounded-xl gradient-lime flex items-center justify-center text-lg">🥏</span>
              <span>UF Tracker</span>
            </Link>
            <div className="flex items-center gap-1">
              {links.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-[var(--dark)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--dark)] hover:bg-black/5'
                    }`}
                    style={isActive ? { background: 'var(--primary)' } : {}}>
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar (logo only) */}
      <div className="lg:hidden sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2 font-heading font-extrabold text-lg" style={{ color: 'var(--dark)' }}>
            <span className="w-8 h-8 rounded-lg gradient-lime flex items-center justify-center text-base">🥏</span>
            <span>UF Tracker</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/history" className={`p-2 rounded-xl transition-colors ${pathname.startsWith('/history') ? 'bg-[var(--primary)]' : 'hover:bg-black/5'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: pathname.startsWith('/history') ? 'var(--dark)' : 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </Link>
            <Link href="/settings" className={`p-2 rounded-xl transition-colors ${pathname.startsWith('/settings') ? 'bg-[var(--primary)]' : 'hover:bg-black/5'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: pathname.startsWith('/settings') ? 'var(--dark)' : 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-200/50 animate-slide-up">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {mobileLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 relative">
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'gradient-lime' : ''}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ color: isActive ? 'var(--dark)' : 'var(--text-secondary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-[var(--dark)]' : 'text-[var(--text-secondary)]'}`}>
                  {link.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full" style={{ background: 'var(--primary)' }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
