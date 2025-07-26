'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 animated-gradient">
      <div className="text-center max-w-3xl z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 animate-fadeInUp" style={{ animationFillMode: 'backwards' }}>
          AI-Powered Component Generator
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-300 animate-fadeInUp animation-delay-200" style={{ animationFillMode: 'backwards' }}>
          Build and preview React components instantly. Just describe what you need, and let our AI bring your ideas to life.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6 animate-fadeInUp animation-delay-400" style={{ animationFillMode: 'backwards' }}>
          <Link
            href="/auth/login"
            className="group relative inline-block rounded-lg bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform transform-gpu hover:scale-105 hover:shadow-blue-500/50"
          >
            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
            <span className="relative">Log In</span>
          </Link>
          <Link
            href="/auth/signup"
            className="group relative inline-block rounded-lg bg-gray-800 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform transform-gpu hover:scale-105 hover:shadow-gray-500/50"
          >
             <span className="absolute inset-0 rounded-lg border-2 border-gray-600 transition-all duration-300 group-hover:border-blue-500"></span>
            <span className="relative">Sign Up</span>
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-8 text-gray-500 animate-fadeIn animation-delay-600" style={{ animationFillMode: 'backwards' }}>
        <p>Built for a B.Tech CSE Assignment.</p>
      </footer>
    </div>
  );
}