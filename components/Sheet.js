'use client';
import { useEffect } from 'react';
import { AnimatePresence, m, useDragControls } from 'framer-motion';
import { IconClose } from './Icons';

// Bottom sheet - the app never jumps to a new page for quick actions
export default function Sheet({ open, onClose, title, children, tall = false }) {
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
          <m.div className="absolute inset-0 bg-black/75" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <m.div
            className={`relative w-full max-w-[560px] md:max-w-[720px] bg-[#141414] border-t-2 border-lime rounded-t-[28px] flex flex-col ${tall ? 'h-[92dvh]' : 'max-h-[92dvh]'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 340 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}
          >
            <div className="pt-3 pb-1 cursor-grab touch-none" onPointerDown={(e) => controls.start(e)}>
              <div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h2 className="text-xl uppercase">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10"><IconClose /></button>
            </div>
            <div className="overflow-y-auto px-5 pb-8 pb-safe flex-1">{children}</div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
