// src/app/playground/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Expanded types for our session and chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  _id: string;
  name: string;
  jsxCode: string;
  cssCode: string;
  chatHistory: ChatMessage[];
}

export default function PlaygroundPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Function to scroll chat to the bottom
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // Fetch all sessions for the logged-in user
    useEffect(() => {
        const fetchSessions = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                router.push('/auth/login');
                return;
            }

            try {
                const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/sessions', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                setSessions(response.data);
                if (response.data.length > 0) {
                    setActiveSession(response.data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch sessions:', err);
                setError('Failed to load sessions. Please log in again.');
                router.push('/auth/login');
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [router]);

    // Scroll chat down when active session changes or new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [activeSession?.chatHistory]);

    // Function to create a new session
    const handleNewSession = async () => {
        const accessToken = localStorage.getItem('accessToken');
        try {
            const response = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + '/sessions', {}, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const newSession = response.data;
            setSessions([newSession, ...sessions]); // Add new session to the top of the list
            setActiveSession(newSession); // Make the new session active
        } catch (err) {
            console.error('Failed to create new session:', err);
            setError('Could not create a new session.');
        }
    };
    
    // Function to handle user logout
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        router.push('/auth/login');
    };

    // Function to send a prompt to the backend
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !activeSession || isGenerating) return;

        setIsGenerating(true);
        const accessToken = localStorage.getItem('accessToken');
        
        // Add user message to UI immediately for better UX
        const newUserMessage: ChatMessage = { role: 'user', content: prompt };
        setActiveSession(prev => prev ? { ...prev, chatHistory: [...prev.chatHistory, newUserMessage] } : null);
        setPrompt('');

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${activeSession._id}/generate`,
                { prompt },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            const updatedSession: Session = response.data;
            
            // Update the active session with the final data from the backend
            setActiveSession(updatedSession);

            // Update the session list as well
            setSessions(sessions.map(s => s._id === updatedSession._id ? updatedSession : s));

        } catch (err) {
            console.error('Failed to generate code:', err);
            setError('An error occurred while generating the component.');
            // Optional: remove the optimistic user message if the API call fails
             setActiveSession(prev => prev ? { ...prev, chatHistory: prev.chatHistory.slice(0, -1) } : null);
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            {/* Left Sidebar: Session List */}
            <aside className="w-72 bg-gray-800 p-4 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">My Components</h1>
                    <button
                        onClick={handleNewSession}
                        title="Create new session"
                        className="p-2 rounded-md bg-gray-700 hover:bg-blue-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            onClick={() => setActiveSession(session)}
                            className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors ${
                                activeSession?._id === session._id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        >
                            <p className="font-medium truncate">{session.name}</p>
                        </div>
                    ))}
                </div>
                 <button
                    onClick={handleLogout}
                    className="mt-4 flex items-center justify-center w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-md hover:bg-red-600 hover:text-white transition-colors"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V5h10a1 1 0 100-2H3zm12.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L17.586 12H10a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                   Log Out
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                 {/* Left side of main content */}
                <div className="flex flex-col flex-1 gap-4">
                    {/* Component Preview */}
                    <div className="flex-1 flex flex-col bg-gray-800 rounded-lg shadow">
                         <h2 className="text-lg font-semibold p-4 border-b border-gray-700">Preview</h2>
                         <div className="flex-1 p-4 flex items-center justify-center">
                            {/* Iframe for micro-frontend will go here */}
                            <p className="text-gray-500">Component rendering is the next step!</p>
                         </div>
                    </div>

                    {/* Code Editor */}
                    <div className="flex-1 flex flex-col bg-gray-800 rounded-lg shadow">
                        <div className="flex border-b border-gray-700 px-2">
                            <button className="py-3 px-4 border-b-2 border-blue-500 font-semibold text-white">JSX/TSX</button>
                            <button className="py-3 px-4 text-gray-400 hover:text-white">CSS</button>
                        </div>
                        <div className="flex-1 p-1">
                            <pre className="bg-gray-900 text-gray-300 p-4 rounded-b-md h-full overflow-auto text-sm font-mono">
                                <code>
                                    {activeSession?.jsxCode || 'Select a session or create a new one to start.'}
                                </code>
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Chat Panel (Right) */}
                <div className="lg:w-96 flex flex-col bg-gray-800 rounded-lg shadow shrink-0">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-700">Chat</h2>
                    <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {/* Render actual chat history */}
                        {activeSession?.chatHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-lg max-w-xs break-words ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                         {isGenerating && (
                            <div className="flex justify-start">
                                <div className="p-3 bg-gray-700 rounded-lg">
                                    <span className="animate-pulse">Generating...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={isGenerating ? "Please wait..." : "Describe your component..."}
                            disabled={isGenerating || !activeSession}
                            className="w-full p-3 border border-gray-700 bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </form>
                </div>
            </main>
        </div>
    );
}