'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallBackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('accessToken', token);
      router.push('/playground');
    } else {
      router.push('/auth/login?error=oauth_failed');
    }
  }, [router, searchParams]);

  return null; // The logic is handled in useEffect, so we don't need to render anything
}