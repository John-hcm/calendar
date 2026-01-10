import { Suspense } from 'react';
import TasksNewPageClient from './TasksNewPageClient';

export default function TasksNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black/90" />}>
      <TasksNewPageClient />
    </Suspense>
  );
}
