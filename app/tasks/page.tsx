import { Suspense } from 'react';
import TasksPageClient from './TasksPageClient';

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black/90" />}>
      <TasksPageClient />
    </Suspense>
  );
}
