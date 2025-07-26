'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // New state
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // --- New Client-side Validation ---
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        
        if (!backendUrl) {
            setError('Backend URL is not configured. Please check your .env.local file and restart the server.');
            return;
        }

        try {
            const response = await axios.post(`${backendUrl}/auth/signup`, {
                email,
                password,
                confirmPassword, // Send to backend
            });
            setMessage(response.data.message + ' You can now log in.');
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err: unknown) {
            console.error('Signup error:', err);
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    setError(err.response.data?.message || 'Signup failed. Please try again.');
                } else if (err.request) {
                    setError('Cannot connect to the server. Is the backend running at ' + backendUrl + '?');
                } else {
                    setError('An unexpected error occurred during signup.');
                }
            } else {
                setError('An unknown error occurred.');
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center animated-gradient text-white p-4">
            <div className="w-full max-w-md space-y-8 animate-fadeInUp">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Component Generator</h1>
                    <p className="mt-2 text-gray-400">Create your account</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800/50 backdrop-blur-sm border border-white/10 p-8 rounded-lg shadow-2xl">
                     <div className="space-y-2">
                        <label htmlFor="email" className="font-medium text-gray-300">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="font-medium text-gray-300">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>
                    {/* --- New Confirm Password Field --- */}
                    <div className="space-y-2">
                        <label htmlFor="confirm-password" className="font-medium text-gray-300">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        Sign Up
                    </button>
                    {message && <p className="text-green-400 text-center">{message}</p>}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                </form>
                <p className="text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <a href="/auth/login" className="font-medium text-blue-400 hover:underline">
                        Log in
                    </a>
                </p>
            </div>
        </div>
    );
}