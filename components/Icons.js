// Inline SVG icons (no icon library = smaller JS)
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const S = ({ size = 24, children, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...P} className={className} aria-hidden="true">{children}</svg>
);

export const IconTrack = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5z" fill="currentColor" /></S>;
export const IconFeed = (p) => <S {...p}><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /></S>;
export const IconWatch = (p) => <S {...p}><rect x="7" y="6" width="10" height="12" rx="3" /><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2.5l1.5 1" /></S>;
export const IconDash = (p) => <S {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></S>;
export const IconUser = (p) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></S>;
export const IconPause = (p) => <S {...p}><path d="M8 5v14M16 5v14" strokeWidth="3.4" /></S>;
export const IconPlay = (p) => <S {...p}><path d="M8 5l12 7-12 7z" fill="currentColor" /></S>;
export const IconStop = (p) => <S {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></S>;
export const IconLock = (p) => <S {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></S>;
export const IconBack = (p) => <S {...p}><path d="M15 5l-7 7 7 7" /></S>;
export const IconClose = (p) => <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>;
export const IconCheck = (p) => <S {...p}><path d="M5 12.5l4.5 4.5L19 7" /></S>;
export const IconShare = (p) => <S {...p}><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" /></S>;
export const IconDownload = (p) => <S {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></S>;
export const IconTrash = (p) => <S {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></S>;
export const IconEdit = (p) => <S {...p}><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" /></S>;
export const IconWifiOff = (p) => <S {...p}><path d="M3 3l18 18M8.5 16.5a5 5 0 017 0M5 12.5a10 10 0 015-2.7M19 12.5a10 10 0 00-4-2.5M12 20h.01" /></S>;
export const IconBolt = (p) => <S {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" /></S>;
export const IconSync = (p) => <S {...p}><path d="M20 8a8 8 0 00-14-2M4 4v4h4M4 16a8 8 0 0014 2M20 20v-4h-4" /></S>;
export const IconUpload = (p) => <S {...p}><path d="M12 16V4M7 9l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" /></S>;
export const IconLink = (p) => <S {...p}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1" /></S>;
export const IconChat = (p) => <S {...p}><path d="M4 5h16v11H9l-5 4z" /></S>;
export const IconShield = (p) => <S {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></S>;
export const IconStar = ({ size = 20, on = true, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill={on ? '#C6FF00' : 'none'} stroke={on ? '#C6FF00' : 'rgba(255,255,255,.35)'} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
