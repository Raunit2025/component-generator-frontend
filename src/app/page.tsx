// src/app/page.tsx
'use client'; // This directive is necessary for client-side components in App Router

import { useState, useEffect } from 'react';
// import axios from 'axios'; // You could use axios here if you prefer, but fetch is fine for this simple test

export default function Home() {
  const [message, setMessage] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        // Use the environment variable here!
        // Ensure NEXT_PUBLIC_BACKEND_URL is set in your .env.local file
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        if (!backendUrl) {
          setError("Backend URL is not configured. Check your .env.local file.");
          setMessage("Error!");
          return;
        }

        // Make sure this matches your backend's URL and port from .env.local
        const response = await fetch(`${backendUrl}/`); // Use template literal
        // If using axios: const response = await axios.get(`${backendUrl}/`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text(); // Or .json() if your backend returns JSON
        setMessage(data);
      } catch (e: any) {
        console.error("Error fetching from backend:", e);
        setError(`Failed to fetch from backend: ${e.message}`);
      }
    };

    fetchBackendData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Component Generator!</h1>
      <p className="text-lg text-gray-700">Message from backend: <span className="font-semibold">{message}</span></p>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </main>
  );
}