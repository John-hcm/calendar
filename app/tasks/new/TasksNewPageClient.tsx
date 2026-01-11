'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ymd } from '@/lib/date';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { createTask } from '@/lib/db';

export default function TasksNewPageClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const date = sp.get('date') ?? ymd(new Date());
  const { userId, loading: authLoading } = useRequireAuth(`/tasks/new?date=${encodeURIComponent(date)}`);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(date);
  const [errMsg, setErrMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDueDate(date);
  }, [date]);

  const save = async () => {
    if (!userId) return;
    const t = title.trim();
    if (!t) {
      setErrMsg('제목을 입력해 주세요.');
      return;
    }
    setErrMsg('');
    setSaving(true);
    try {
      await createTask({ user_id: userId, title: t, notes: notes.trim() ? notes.trim() : null, due_date: dueDate || null });
      router.replace(`/tasks?start=${encodeURIComponent(ymd(new Date()))}&end=${encodeURIComponent(ymd(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 30)))}`);
      router.refresh();
    } catch (e: any) {
      setErrMsg(e?.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#202124]" />;

  return (
    <div className="min-h-screen bg-[#202124] px-3 py-5 text-[#e8eaed]">
      <div className="mx-auto w-full max-w-[900px]">
        <div className="flex items-center justify-between">
          <Link href="/tasks" className="text-sm font-bold underline">
            ◀ 테스크
          </Link>
          <div className="text-lg font-extrabold">새 테스크</div>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-[#202124] border border-[#3c4043] px-4 py-2 text-sm font-semibold text-[#e8eaed] disabled:opacity-60"
          >
            저장
          </button>
        </div>

        <div className="mt-4 rounded-3xl bg-[#202124] border border-[#3c4043] p-4 text-[#e8eaed]">
          {errMsg && <div className="rounded-xl bg-[#3c4043] px-3 py-2 text-sm text-[#f28b82]">{errMsg}</div>}

          <div className="mt-3 grid gap-3">
            <label className="grid gap-1">
              <div className="text-sm font-bold">제목</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border px-3 py-2"
                placeholder="예: 서류 준비"
              />
            </label>

            <label className="grid gap-1">
              <div className="text-sm font-bold">마감일</div>
              <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="rounded-xl border px-3 py-2" />
            </label>

            <label className="grid gap-1">
              <div className="text-sm font-bold">메모</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[140px] rounded-xl border px-3 py-2"
                placeholder="필요하면 적어두세요"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
