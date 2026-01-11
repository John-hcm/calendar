import { Suspense } from 'react';
import TasksEditPageClient from './TasksEditPageClient';

export default function TasksEditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#202124]" />}>
      <TasksEditPageClient />
    </Suspense>
  );
}
