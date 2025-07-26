// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await axios.post(`${backendUrl}/auth/login`, {
                email,
                password,
            });
            setMessage(response.data.message || 'Login successful!');
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('userEmail', response.data.user.email);
            localStorage.setItem('userId', response.data.user.id);
            router.push('/playground');
        } catch (err: unknown) {
            console.error('Login error:', err); // Keep this for full object inspection

            if (axios.isAxiosError(err)) {
                // This means the server responded with an error status code (4xx or 5xx)
                if (err.response) {
                    setError(err.response.data.message || 'Login failed. Invalid credentials.');
                } else if (err.request) {
                    // This means the request was made but no response was received
                    // (e.g., backend server is down, CORS issue)
                    setError('Cannot connect to the server. Please check your connection or try again later.');
                } else {
                    // Something else happened in setting up the request
                    setError('An unexpected error occurred.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Component Generator</h1>
                    <p className="mt-2 text-gray-400">Log in to your account</p>
                </div>

                <div className="space-y-4 bg-gray-800 p-8 rounded-lg shadow-lg">
                    {/* Social Logins */}
                    <div className="flex flex-col space-y-3">
                        <a href={`${backendUrl}/auth/google`} className="w-full flex items-center justify-center rounded-md bg-red-600 py-2 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                            Sign in with Google
                        </a>
                        <a href={`${backendUrl}/auth/github`} className="w-full flex items-center justify-center rounded-md bg-gray-700 py-2 font-semibold text-white transition hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                            Sign in with GitHub
                        </a>
                    </div>

                    <div className="flex items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="mx-4 text-gray-400">or</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="font-medium">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="font-medium">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            Log In with Email
                        </button>
                        {message && <p className="text-green-400 text-center">{message}</p>}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                    </form>
                </div>
                <p className="text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <a href="/auth/signup" className="font-medium text-blue-400 hover:underline">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}