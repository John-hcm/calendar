import { Suspense } from 'react';
import DayPageClient from './DayPageClient';

export default function DayPage() {
  // useSearchParams()는 CSR bailout이 발생할 수 있어, 페이지 루트에서 Suspense로 감싸야 빌드(prerender)가 실패하지 않습니다.
  return (
    <Suspense fallback={<div className="min-h-screen bg-black/90" />}>
      <DayPageClient />
    </Suspense>
  );
}
