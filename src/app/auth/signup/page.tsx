// src/app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios'; // Or use 'fetch' if you prefer

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + '/auth/signup', {
                email,
                password,
            });
            setMessage(response.data.message || 'Signup successful!');
            // Optionally clear form fields or redirect
            setEmail('');
            setPassword('');
        } catch (err: any) {
            console.error('Signup error:', err.response?.data || err);
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email:
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                            Password:
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Sign Up
                        </button>
                    </div>
                    {message && <p className="mt-4 text-green-500 text-center">{message}</p>}
                    {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                </form>
                <p className="mt-6 text-center text-gray-600">
                    Already have an account? <a href="/auth/login" className="text-blue-500 hover:underline">Log in</a>
                </p>
            </div>
        </div>
    );
}