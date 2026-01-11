'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type Props = {
  open: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

const NAV_ITEMS: Array<{ href: string; label: string; preserveDate?: boolean }> = [
  { href: '/calendar', label: '캘린더' },
  // day는 날짜 파라미터가 있으면 유지해주는 게 UX가 좋음
  { href: '/day', label: 'Day (일 상세)', preserveDate: true },
  { href: '/entries', label: 'Entries (기록)' },
  { href: '/events', label: 'Events (약속/기념일)' },
  { href: '/tasks', label: 'Tasks (테스크)' },
  { href: '/categories', label: 'Categories (카테고리)' },
];

export default function SidebarDrawer({ open, onClose, onLogout }: Props) {
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    // 스크롤 잠금
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const date = sp.get('date');

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/50"
        aria-label="닫기"
        onClick={onClose}
      />

      {/* drawer */}
      <div
        className="absolute left-0 top-0 h-full w-[290px] border-r border-[#3c4043] bg-[#202124] text-[#e8eaed] shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-base font-extrabold">Calio</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-2">
          <div className="mb-2 px-2 text-[12px] font-bold text-[#9aa0a6]">메뉴</div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((it) => {
              const active = pathname === it.href || (it.href !== '/calendar' && pathname.startsWith(it.href));
              const href = it.preserveDate && date ? `${it.href}?date=${encodeURIComponent(date)}` : it.href;

              return (
                <Link
                  key={it.href}
                  href={href}
                  onClick={onClose}
                  className={[
                    'rounded-xl px-3 py-2 text-sm font-semibold transition',
                    active ? 'bg-white/10' : 'hover:bg-white/10',
                  ].join(' ')}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <div className="my-4 h-px bg-[#3c4043]" />

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="w-full rounded-xl border border-[#3c4043] px-3 py-2 text-left text-sm font-bold hover:bg-white/10"
          >
            로그아웃
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-[12px] text-[#9aa0a6]">
          ESC로 닫기
        </div>
      </div>
    </div>
  );
}
