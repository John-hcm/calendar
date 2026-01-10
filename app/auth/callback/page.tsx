import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>인증 처리 중...</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
