'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LazyMotion } from 'framer-motion';
import { useApp } from './AppProvider';
import { useTracker } from '@/hooks/useTracker';
import BottomNav from './BottomNav';
import { fmtDuration } from '@/lib/format';

const loadFeatures = () => import('./motion-features').then((m) => m.default);

function Splash() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="font-heading text-4xl text-lime blink">VUKA</div>
    </div>
  );
}

export default function Shell({ children }) {
  const { ready, user, toastMsg } = useApp();
  const tracker = useTracker();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';

  useEffect(() => {
    if (!ready) return;
    if (!user && !isLogin) router.replace('/login');
    if (user && isLogin) router.replace('/');
  }, [ready, user, isLogin, router]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }
  }, []);

  if (!ready || (!user && !isLogin) || (user && isLogin)) return <Splash />;

  const running = tracker.status !== 'idle';
  const onTrack = pathname === '/';
  const hideNav = isLogin || (running && onTrack);

  return (
    <LazyMotion features={loadFeatures} strict={false}>
      {running && !onTrack && (
        <Link
          href="/"
          className="fixed top-0 inset-x-0 z-40 bg-start text-white pt-safe"
          aria-label="Run in progress, tap to return"
        >
          <div className="mx-auto max-w-[560px] flex items-center justify-between px-4 py-2 text-sm font-bold">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white blink" /> {tracker.status === 'paused' ? 'Run paused' : 'Run in progress'}</span>
            <span className="font-mono">{fmtDuration(tracker.elapsed)} · {(tracker.distance / 1000).toFixed(2)} km</span>
          </div>
        </Link>
      )}
      <main className={`mx-auto w-full ${isLogin ? 'max-w-[720px]' : 'max-w-[560px] md:max-w-[720px]'} min-h-dvh pt-safe ${hideNav ? '' : 'pb-28'} ${running && !onTrack ? 'pt-10' : ''}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
      {toastMsg && (
        <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none" role="status" aria-live="polite">
          <div className={`pointer-events-auto max-w-sm rounded-full px-5 py-3 text-sm font-bold shadow-xl ${toastMsg.type === 'err' ? 'bg-start text-white' : 'bg-lime text-black'}`}>{toastMsg.msg}</div>
        </div>
      )}
    </LazyMotion>
  );
}
