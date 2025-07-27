'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Interface for the user profile data
interface UserProfile {
    id: string;
    email: string;
    createdAt: string;
}

export default function ProfilePage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                router.push('/auth/login');
                return;
            }

            try {
                const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/auth/profile', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                setUserProfile(response.data);
            } catch (err: unknown) {
                console.error('Failed to fetch profile:', err);
                setError('Failed to load profile. Please log in again.');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userId');
                router.push('/auth/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        router.push('/auth/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl font-semibold">Loading profile...</div>
        );
    }

    if (error || !userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600 text-xl font-semibold">
                {error || 'Could not load profile.'}
                <button onClick={() => router.push('/auth/login')} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">User Profile</h2>
                <p className="text-lg text-gray-700 mb-2">
                    <span className="font-semibold">Email:</span> {userProfile.email}
                </p>
                <p className="text-lg text-gray-700 mb-4">
                    <span className="font-semibold">User ID:</span> {userProfile.id}
                </p>
                <p className="text-sm text-gray-500">
                    <span className="font-semibold">Account Created:</span> {new Date(userProfile.createdAt).toLocaleString()}
                </p>
                <button
                    onClick={handleLogout}
                    className="mt-8 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}