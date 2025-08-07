'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- Dynamic Preview Component ---
const DynamicPreview = () => {
    const components = [
        {
            name: 'UserProfile.tsx',
            content: (
                <div className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                    <div>
                        <div className="w-24 h-4 bg-gray-500/80 rounded mb-2"></div>
                        <div className="w-32 h-3 bg-gray-600/80 rounded"></div>
                    </div>
                </div>
            )
        },
        {
            name: 'LoginButton.tsx',
            content: (
                <div className="flex items-center justify-center p-4">
                    <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-[0_0_20px_theme(colors.blue.600/0.5)] hover:bg-blue-700 transition-all scale-110">
                        Get Started
                    </button>
                </div>
            )
        },
        {
            name: 'Chart.tsx',
            content: (
                 <div className="w-full h-full flex items-end gap-2 p-4">
                    <div className="w-1/4 h-1/3 bg-green-500/80 rounded-t-md animate-pulse animation-delay-200"></div>
                    <div className="w-1/4 h-2/3 bg-green-500/60 rounded-t-md animate-pulse"></div>
                    <div className="w-1/4 h-1/2 bg-green-500/80 rounded-t-md animate-pulse animation-delay-400"></div>
                    <div className="w-1/4 h-3/4 bg-green-500/70 rounded-t-md animate-pulse animation-delay-600"></div>
                </div>
            )
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % components.length);
                setIsFading(false);
            }, 500); // Half-second fade transition
        }, 3000);
        return () => clearInterval(interval);
    }, [components.length]);

    return (
        <div className="w-full max-w-lg mx-auto bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-[float_8s_ease-in-out_infinite]">
            <div className="flex items-center justify-between p-3 bg-gray-800/60 border-b border-white/10">
                <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 bg-red-500 rounded-full"></span>
                    <span className="w-3.5 h-3.5 bg-yellow-500 rounded-full"></span>
                    <span className="w-3.5 h-3.5 bg-green-500 rounded-full"></span>
                </div>
                <div className="text-sm text-gray-400 font-mono">
                    {components[currentIndex].name}
                </div>
            </div>
            <div className={`p-8 h-52 flex items-center justify-center transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                {components[currentIndex].content}
            </div>
        </div>
    );
};


export default function HomePage() {
  const headlineText = "Build UI at the Speed of Thought.";

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 25% 30%, #1e40af 0%, transparent 40%), radial-gradient(circle at 75% 70%, #5b21b6 0%, transparent 40%)`}}></div>
        
        <main className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
            <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white animate-fadeInUp">
                    {headlineText}
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-400 animate-fadeInUp animation-delay-400">
                    Describe any React component, from simple buttons to complex dashboards. Our AI will generate the code, which you can preview, refine, and export instantly.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-6 animate-fadeInUp animation-delay-800">
                    <Link
                        href="/auth/login"
                        className="group relative inline-block rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform transform-gpu hover:scale-105 hover:shadow-blue-500/50"
                    >
                        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                        <span className="relative">Get Started</span>
                    </Link>
                </div>
            </div>

            <div className="relative animate-fadeInUp animation-delay-600">
                <DynamicPreview />
            </div>
        </main>
    </div>
  );
}