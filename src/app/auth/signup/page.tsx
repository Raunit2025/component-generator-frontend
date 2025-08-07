'use client';

import { useState, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const PasswordStrengthMeter = ({ password }: { password: string }) => {
    const strength = useMemo(() => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[@$!%*?&]/.test(password)) score++;
        return score;
    }, [password]);

    const strengthColors = ['bg-gray-600', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
    const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

    return (
        <div className="w-full mt-2">
            <div className="flex h-1.5 rounded-full overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1/5">
                        <div className={`h-full transition-all duration-300 ${strength > i ? strengthColors[strength] : 'bg-gray-700'}`}></div>
                    </div>
                ))}
            </div>
            {password.length > 0 && <p className={`text-xs mt-1 ${strength > 2 ? 'text-green-400' : 'text-yellow-400'}`}>{strengthLabels[password.length < 8 ? 0 : strength]}</p>}
        </div>
    );
};


export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        
        if (!backendUrl) {
            setError('Backend URL is not configured.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${backendUrl}/auth/signup`, {
                email,
                password,
                confirmPassword,
            });
            setMessage(response.data.message + ' You can now log in.');
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    if (err.response.status === 422) {
                        const errorMessages = err.response.data.errors.map((error: any) => Object.values(error)[0]).join(' ');
                        setError(errorMessages);
                    } else {
                        setError(err.response.data?.message || 'Signup failed. Please try again.');
                    }
                } else if (err.request) {
                    setError('Cannot connect to the server. Is the backend running at ' + backendUrl + '?');
                } else {
                    setError('An unexpected error occurred during signup.');
                }
            } else {
                setError('An unknown error occurred.');
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
                    <h1 className="text-3xl font-bold tracking-tight text-white">Create Your Account</h1>
                    <p className="mt-2 text-gray-400">Join UI Forge AI</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800/50 backdrop-blur-sm border border-white/10 p-8 rounded-lg shadow-2xl">
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
                        <PasswordStrengthMeter password={password} />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="confirm-password" className="font-medium text-gray-300">Confirm Password</label>
                         <div className="relative">
                            <input
                                id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                className="w-full rounded-md border border-gray-700 bg-gray-900/50 px-3 py-2 pr-10 placeholder-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center rounded-md bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spinner"></div> : 'Create Account'}
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