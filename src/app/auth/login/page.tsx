'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleIcon, GitHubIcon } from '@/components/AuthIcons';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-900 overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 25% 30%, #1e40af 0%, transparent 40%), radial-gradient(circle at 75% 70%, #5b21b6 0%, transparent 40%)`}}></div>
            <div className="w-full max-w-md space-y-8 z-10 animate-fadeInUp">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
                    <p className="mt-2 text-gray-400">Log in to continue to UI Forge AI</p>
                </div>

                <div className="space-y-4 bg-gray-800/50 backdrop-blur-sm border border-white/10 p-8 rounded-lg shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="font-medium text-gray-300">Email</label>
                            <input
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="font-medium text-gray-300">Password</label>
                            <div className="relative">
                                <input
                                    id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 pr-10 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center rounded-md bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-blue-800 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spinner"></div> : 'Log In with Email'}
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
                    Don&apos;t have an account?{' '}
                    <a href="/auth/signup" className="font-medium text-blue-400 hover:underline">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}