import { Suspense } from 'react';
import CallbackClient from './CallBackClient';

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <p>Authenticating...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CallbackClient />
    </Suspense>
  );
}