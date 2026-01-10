'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DayCell,
  addMonths,
  getMonthGrid,
  isSameYmd,
  lunarShortFromSolarYmd,
  monthTitle,
  ymd,
} from '@/lib/date';
import { useRequireAuth } from '@/lib/useRequireAuth';
import {
  CalendarEvent,
  DailyEntry,
  EntryCategory,
  TaskItem,
  fetchCategories,
  fetchEntriesByRange,
  fetchEventsByRange,
  fetchTasksByRange,
} from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';

const DOW_KR = ['일', '월', '화', '수', '목', '금', '토'];

function rangeStartEndForGrid(cells: DayCell[]) {
  const start = cells[0]?.date ?? new Date();
  const end = cells[cells.length - 1]?.date ?? new Date();
  return { startYmd: ymd(start), endYmd: ymd(end) };
}

export default function CalendarPage() {
  const router = useRouter();

  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month0, setMonth0] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const { userId, loading: authLoading } = useRequireAuth('/calendar');

  const cells = useMemo(() => getMonthGrid(year, month0), [year, month0]);
  const title = useMemo(() => monthTitle(year, month0), [year, month0]);
  const { startYmd, endYmd } = useMemo(() => rangeStartEndForGrid(cells), [cells]);

  const [categories, setCategories] = useState<EntryCategory[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [errMsg, setErrMsg] = useState<string>('');
  const [dataLoading, setDataLoading] = useState(false);

  const categoryById = useMemo(() => {
    const m = new Map<string, EntryCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const entriesByDate = useMemo(() => {
    const m = new Map<string, DailyEntry[]>();
    for (const e of entries) {
      const key = e.entry_date;
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return m;
  }, [entries]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ev.solar_date;
      const arr = m.get(key) ?? [];
      arr.push(ev);
      m.set(key, arr);
    }
    return m;
  }, [events]);

  const tasksByDate = useMemo(() => {
    const m = new Map<string, TaskItem[]>();
    for (const t of tasks) {
      const key = t.due_date;
      if (!key) continue;
      const arr = m.get(key) ?? [];
      arr.push(t);
      m.set(key, arr);
    }
    return m;
  }, [tasks]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const run = async () => {
      setErrMsg('');
      setDataLoading(true);
      try {
        const [cats, ents, evs, tks] = await Promise.all([
          fetchCategories(userId),
          fetchEntriesByRange(userId, startYmd, endYmd),
          fetchEventsByRange(userId, startYmd, endYmd),
          fetchTasksByRange(userId, startYmd, endYmd),
        ]);
        if (!mounted) return;
        setCategories(cats);
        setEntries(ents);
        setEvents(evs);
        setTasks(tks);
      } catch (e: any) {
        if (!mounted) return;
        setErrMsg(e?.message ?? '데이터 로딩 실패');
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [userId, startYmd, endYmd]);

  const goPrevMonth = () => {
    const next = addMonths(year, month0, -1);
    setYear(next.year);
    setMonth0(next.month0);
    setSelectedDate(new Date(next.year, next.month0, 1));
  };

  const goNextMonth = () => {
    const next = addMonths(year, month0, +1);
    setYear(next.year);
    setMonth0(next.month0);
    setSelectedDate(new Date(next.year, next.month0, 1));
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth0(t.getMonth());
    setSelectedDate(t);
    router.push(`/day?date=${encodeURIComponent(ymd(t))}`);
  };

  const openNewEntry = () => router.push(`/entries/new?date=${encodeURIComponent(ymd(selectedDate))}`);
  const openNewEvent = () => router.push(`/events/new?date=${encodeURIComponent(ymd(selectedDate))}`);
  const openNewTask = () => router.push(`/tasks/new?date=${encodeURIComponent(ymd(selectedDate))}`);

  const openEntries = () => router.push('/entries');
  const openEvents = () => router.push('/events');
  const openTasks = () => router.push('/tasks');

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/login?next=%2Fcalendar');
    router.refresh();
  };

  const openDayDetail = (d: Date) => {
    setSelectedDate(d);
    router.push(`/day?date=${encodeURIComponent(ymd(d))}`);
  };

  // mini calendar (sidebar)
  const miniCells = useMemo(() => getMonthGrid(year, month0), [year, month0]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#f6f7f8]" />;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* Top bar (Google Calendar 느낌) */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="text-base font-extrabold text-black">캘린더</div>
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={goToday} className="rounded-full border px-3 py-1.5 text-sm font-semibold">
                오늘
              </button>
              <button
                onClick={goPrevMonth}
                className="h-9 w-9 rounded-full hover:bg-black/5 text-lg"
                aria-label="prev-month"
              >
                ‹
              </button>
              <button
                onClick={goNextMonth}
                className="h-9 w-9 rounded-full hover:bg-black/5 text-lg"
                aria-label="next-month"
              >
                ›
              </button>
              <div className="ml-1 text-lg font-extrabold">{title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={openTasks} className="rounded-full border px-3 py-1.5 text-sm font-semibold">
              테스크
            </button>
            <button onClick={openEntries} className="rounded-full border px-3 py-1.5 text-sm font-semibold">
              기록
            </button>
            <button onClick={openEvents} className="rounded-full border px-3 py-1.5 text-sm font-semibold">
              약속/기념일
            </button>
            <button onClick={logout} className="rounded-full bg-black px-3 py-1.5 text-sm font-semibold text-white">
              로그아웃
            </button>
          </div>
        </div>
        {/* Mobile month title */}
        <div className="sm:hidden px-3 pb-3">
          <div className="flex items-center justify-between">
            <button onClick={goPrevMonth} className="h-9 w-9 rounded-full hover:bg-black/5 text-lg">
              ‹
            </button>
            <div className="text-lg font-extrabold">{title}</div>
            <button onClick={goNextMonth} className="h-9 w-9 rounded-full hover:bg-black/5 text-lg">
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] gap-4 px-3 py-4">
        {/* Sidebar */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <div className="rounded-2xl bg-white p-3 shadow-sm border">
            <button
              onClick={openNewEvent}
              className="w-full rounded-full bg-black px-4 py-2 text-sm font-extrabold text-white"
            >
              + 만들기
            </button>

            <div className="mt-3 rounded-2xl border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold">{title}</div>
                <div className="flex items-center gap-1">
                  <button onClick={goPrevMonth} className="h-7 w-7 rounded-full hover:bg-black/5">‹</button>
                  <button onClick={goNextMonth} className="h-7 w-7 rounded-full hover:bg-black/5">›</button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-black/60">
                {DOW_KR.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {miniCells.map((c) => {
                  const key = ymd(c.date);
                  const isSel = isSameYmd(c.date, selectedDate);
                  return (
                    <button
                      key={c.key}
                      onClick={() => openDayDetail(c.date)}
                      className={[
                        'h-7 rounded-full text-[12px] font-semibold',
                        c.isCurrentMonth ? 'text-black' : 'text-black/30',
                        isSel ? 'bg-black text-white' : 'hover:bg-black/5',
                      ].join(' ')}
                    >
                      {c.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <button onClick={openNewTask} className="rounded-xl border px-3 py-2 text-sm font-semibold text-left">
                + 테스크
              </button>
              <button onClick={openNewEntry} className="rounded-xl border px-3 py-2 text-sm font-semibold text-left">
                + 기록
              </button>
              <button onClick={openNewEvent} className="rounded-xl border px-3 py-2 text-sm font-semibold text-left">
                + 약속/기념일
              </button>
            </div>
          </div>
        </div>

        {/* Main month grid */}
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
            {/* DOW */}
            <div className="grid grid-cols-7 border-b bg-white">
              {DOW_KR.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-sm font-bold text-black/70">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((c) => {
                const isSelected = isSameYmd(c.date, selectedDate);
                const dayKey = ymd(c.date);
                const dayEntries = entriesByDate.get(dayKey) ?? [];
                const dayEvents = eventsByDate.get(dayKey) ?? [];
                const dayTasks = tasksByDate.get(dayKey) ?? [];

                const chips = dayEntries.slice(0, 2).map((e) => {
                  const cat = categoryById.get(e.category_id);
                  return {
                    id: e.id,
                    label: cat?.name ?? '기록',
                    bg: cat?.color_bg ?? '#E9D5FF',
                    fg: cat?.color_text ?? '#111827',
                  };
                });

                return (
                  <button
                    key={c.key}
                    onClick={() => openDayDetail(c.date)}
                    className={[
                      'min-w-0 border-b border-r p-2 text-left transition',
                      'h-[110px] sm:h-[120px] lg:h-[128px]',
                      'hover:bg-black/[0.02]',
                      !c.isCurrentMonth ? 'bg-black/[0.015]' : 'bg-white',
                      isSelected ? 'ring-2 ring-black/20 z-[1]' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={['text-sm font-extrabold', c.isCurrentMonth ? 'text-black' : 'text-black/35'].join(' ')}>
                        {c.date.getDate()}
                        <span className={['ml-1 text-[11px] font-semibold', c.isCurrentMonth ? 'text-black/55' : 'text-black/30'].join(' ')}>
                          ({lunarShortFromSolarYmd(dayKey)})
                        </span>
                      </div>

                      {/* indicators */}
                      <div className="flex items-center gap-1">
                        {dayEvents.length > 0 && <span className="inline-block h-2 w-2 rounded-full bg-blue-500/70" />}
                        {dayTasks.filter((t) => !t.is_done).length > 0 && (
                          <span className="inline-block h-2 w-2 rounded-full bg-purple-500/70" />
                        )}
                      </div>
                    </div>

                    {/* chips */}
                    <div className="mt-2 flex flex-wrap gap-1 overflow-hidden">
                      {chips.map((chip) => (
                        <span
                          key={chip.id}
                          className="max-w-full truncate rounded-full px-2 py-[2px] text-[11px] font-semibold"
                          style={{ backgroundColor: chip.bg, color: chip.fg }}
                        >
                          {chip.label}
                        </span>
                      ))}
                      {dayEntries.length > 2 && <span className="text-[11px] font-semibold text-black/60">…</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            {errMsg && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errMsg}</div>}
            {!errMsg && dataLoading && (
              <div className="rounded-xl bg-white px-3 py-2 text-sm text-black/60 border">데이터 불러오는 중...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
