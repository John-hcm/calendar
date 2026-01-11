import { Suspense } from 'react';
import TasksPageClient from './TasksPageClient';

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#202124]" />}>
      <TasksPageClient />
    </Suspense>
  );
}
