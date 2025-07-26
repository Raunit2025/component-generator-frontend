'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// A simple component for the Google SVG Icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-3 h-5 w-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

// A simple component for the GitHub SVG Icon
const GitHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-3 h-5 w-5">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);


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
            console.error('Login error:', err);
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    setError(err.response.data.message || 'Login failed. Invalid credentials.');
                } else if (err.request) {
                    setError('Cannot connect to the server. Please check your connection or try again later.');
                } else {
                    setError('An unexpected error occurred.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center animated-gradient text-white p-4">
            <div className="w-full max-w-md space-y-8 animate-fadeInUp">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Component Generator</h1>
                    <p className="mt-2 text-gray-400">Log in to your account</p>
                </div>

                <div className="space-y-4 bg-gray-800/50 backdrop-blur-sm border border-white/10 p-8 rounded-lg shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            Log In with Email
                        </button>
                        {message && <p className="text-green-400 text-center">{message}</p>}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                    </form>

                    <div className="flex items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="mx-4 text-xs text-gray-400 uppercase">or</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <a href={`${backendUrl}/auth/google`} className="w-full flex items-center justify-center rounded-md bg-gray-700 py-2 font-semibold text-white transition hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                            <GoogleIcon />
                            <span>Sign in with Google</span>
                        </a>
                        <a href={`${backendUrl}/auth/github`} className="w-full flex items-center justify-center rounded-md bg-gray-700 py-2 font-semibold text-white transition hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                            <GitHubIcon />
                            <span>Sign in with GitHub</span>
                        </a>
                    </div>
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