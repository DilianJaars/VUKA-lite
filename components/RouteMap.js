'use client';
import dynamic from 'next/dynamic';
import { useApp } from './AppProvider';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div className="skeleton w-full h-full min-h-[120px]" />,
});

// Wrapper: respects Data Saver (no map tiles, route only)
export default function RouteMap({ tiles, className = 'w-full h-64', ...rest }) {
  const { user } = useApp();
  const saver = !!user?.settings?.dataSaver;
  return <LeafletMap tiles={tiles ?? !saver} className={className} {...rest} />;
}
