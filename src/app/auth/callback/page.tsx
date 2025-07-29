'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Effect to handle the token from the URL query parameters.
    const token = searchParams.get('token');

    if (token) {
      // If a token is found, store it in localStorage.
      localStorage.setItem('accessToken', token);
      // Redirect the user to the main playground page.
      router.push('/playground');
    } else {
      // If no token is found, redirect to the login page with an error message.
      router.push('/auth/login?error=oauth_failed');
    }
  }, [router, searchParams]); // Rerun effect if router or searchParams change.

  // Display a loading message while the token is being processed.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <p>Authenticating, please wait...</p>
    </div>
  );
}

// The main export for the page, wrapping the logic component in Suspense.
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}
