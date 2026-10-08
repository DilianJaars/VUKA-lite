'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconTrack, IconFeed, IconWatch, IconDash, IconUser } from './Icons';

const TABS = [
  { href: '/', label: 'Track', Icon: IconTrack },
  { href: '/feed', label: 'Feed', Icon: IconFeed },
  { href: '/connect', label: 'Connect', Icon: IconWatch },
  { href: '/dashboard', label: 'Dashboard', Icon: IconDash },
  { href: '/profile', label: 'Profile', Icon: IconUser },
];

export default function BottomNav() {
  const path = usePathname();
  const active = (h) => (h === '/' ? path === '/' || path === '/finish' : path === h || (h === '/dashboard' && path.startsWith('/run/')));
  return (
    <nav aria-label="Main" className="fixed bottom-0 inset-x-0 z-30 bg-[#0A0A0A]/95 border-t border-white/10 pb-safe">
      <ul className="mx-auto max-w-[560px] md:max-w-[720px] grid grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const on = active(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? 'page' : undefined} className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-[11px] font-bold uppercase tracking-wide ${on ? 'text-lime' : 'text-white/60'}`}>
                <Icon size={24} />
                {label}
                <span className={`h-[3px] w-6 rounded-full ${on ? 'bg-lime' : 'bg-transparent'}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
