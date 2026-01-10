'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { TaskItem, deleteTask, fetchTasks, updateTask } from '@/lib/db';

export default function TasksEditPageClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const id = sp.get('id') ?? '';
  const { userId, loading: authLoading } = useRequireAuth(`/tasks/edit?id=${encodeURIComponent(id)}`);

  const [task, setTask] = useState<TaskItem | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId || !id) return;
    let mounted = true;
    const run = async () => {
      setErrMsg('');
      try {
        const list = await fetchTasks(userId);
        const found = list.find((x) => x.id === id) ?? null;
        if (!mounted) return;
        setTask(found);
        if (!found) {
          setErrMsg('테스크를 찾을 수 없습니다.');
          return;
        }
        setTitle(found.title ?? '');
        setNotes(found.notes ?? '');
        setDueDate(found.due_date ?? '');
        setIsDone(!!found.is_done);
      } catch (e: any) {
        if (!mounted) return;
        setErrMsg(e?.message ?? '불러오기 실패');
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [userId, id]);

  const save = async () => {
    if (!userId || !id) return;
    const t = title.trim();
    if (!t) {
      setErrMsg('제목을 입력해 주세요.');
      return;
    }
    setErrMsg('');
    setSaving(true);
    try {
      await updateTask({
        user_id: userId,
        id,
        title: t,
        notes: notes.trim() ? notes.trim() : null,
        due_date: dueDate || null,
        is_done: isDone,
      });
      router.replace('/tasks');
      router.refresh();
    } catch (e: any) {
      setErrMsg(e?.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!userId || !id) return;
    if (!confirm('삭제할까요?')) return;
    setErrMsg('');
    setSaving(true);
    try {
      await deleteTask(userId, id);
      router.replace('/tasks');
      router.refresh();
    } catch (e: any) {
      setErrMsg(e?.message ?? '삭제 실패');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-black/90" />;

  return (
    <div className="min-h-screen bg-black/90 px-3 py-5 text-white">
      <div className="mx-auto w-full max-w-[900px]">
        <div className="flex items-center justify-between">
          <Link href="/tasks" className="text-sm font-bold underline">
            ◀ 테스크
          </Link>
          <div className="text-lg font-extrabold">테스크 수정</div>
          <div className="flex items-center gap-2">
            <button
              onClick={remove}
              disabled={saving}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              삭제
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              저장
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-white p-4 text-black">
          {errMsg && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errMsg}</div>}

          {!errMsg && !task && <div className="rounded-xl bg-black/5 px-3 py-2 text-sm text-black/60">불러오는 중...</div>}

          <div className="mt-3 grid gap-3">
            <label className="grid gap-1">
              <div className="text-sm font-bold">완료</div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isDone} onChange={(e) => setIsDone(e.target.checked)} />
                <span className="text-sm text-black/70">완료 처리</span>
              </div>
            </label>

            <label className="grid gap-1">
              <div className="text-sm font-bold">제목</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border px-3 py-2" />
            </label>

            <label className="grid gap-1">
              <div className="text-sm font-bold">마감일</div>
              <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="rounded-xl border px-3 py-2" />
            </label>

            <label className="grid gap-1">
              <div className="text-sm font-bold">메모</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[140px] rounded-xl border px-3 py-2" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
