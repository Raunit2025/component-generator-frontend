// src/app/playground/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Frame from 'react-frame-component';
import React from 'react';
// @ts-ignore (Babel is loaded from a script tag and won't have types)
import { transform } from '@babel/standalone';
import api from '../../lib/axios'; // Use our custom api client
import axios from 'axios'; // <-- Import axios for the type guard
import JSZip from 'jszip';

// --- Interfaces ---
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

// --- Component Preview ---
const ComponentPreview = ({ jsxCode, cssCode }: { jsxCode: string; cssCode: string }) => {
  try {
    // Step 1: Transpile the JSX/TSX code into plain JavaScript.
    // We no longer need the 'transform-modules-commonjs' plugin.
    const transformedResult = transform(jsxCode, {
      presets: ['react', 'typescript'],
      filename: 'component.tsx',
    });

    if (!transformedResult?.code) {
      throw new Error("Babel transformation returned empty code.");
    }
    
    // The transpiled code will look something like:
    // "const GeneratedComponent = () => { return React.createElement(...) }; GeneratedComponent;"
    const transformedCode = transformedResult.code;
    
    // Step 2: Evaluate the code in a sandboxed function to get the component.
    // We pass React into the function's scope. The last line of the code
    // is the component name itself, which becomes the return value.
    const factory = new Function('React', `return (()=>{${transformedCode}})()`);
    const ComponentToRender = factory(React);

    if (!ComponentToRender || (typeof ComponentToRender !== 'function' && typeof ComponentToRender !== 'object')) {
        return <div style={{ color: '#f97316', padding: '1rem', fontFamily: 'sans-serif' }}>The AI-generated code did not return a valid React component.</div>;
    }
    
    return (
      <>
        <style>{cssCode}</style>
        <ComponentToRender />
      </>
    );
  } catch (error) {
    console.error("Error rendering component:", error);
    return <div style={{ color: '#ef4444', padding: '1rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{String(error)}</div>;
  }
};


// --- Main Page Component ---
export default function PlaygroundPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'jsx' | 'css'>('jsx');
    const [copyStatus, setCopyStatus] = useState(''); // For copy feedback
    const router = useRouter();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // This needs to be memoized or moved outside to avoid being redeclared on every render
    const handleNewSession = async (setActive = true) => {
        const accessToken = localStorage.getItem('accessToken');
        try {
            const response = await api.post('/sessions', {}, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const newSession = response.data;
            setSessions(prev => [newSession, ...prev]);
            if(setActive) setActiveSession(newSession);
        } catch (err) {
            console.error('Failed to create new session:', err);
        }
    };

    useEffect(() => {
        const fetchSessions = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                router.push('/auth/login');
                return;
            }
            try {
                const response = await api.get('/sessions', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                setSessions(response.data);
                if (response.data.length > 0) {
                    setActiveSession(response.data[0]);
                } else {
                  // If no sessions, create one
                  await handleNewSession(false);
                }
            } catch (err: unknown) { // <-- Correctly typed as unknown
                console.error('Failed to fetch sessions:', err);
                // Use axios type guard to safely access properties
                 if (axios.isAxiosError(err) && err.response?.status === 401) {
                    router.push('/auth/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, [router]);

    useEffect(() => {
        scrollToBottom();
    }, [activeSession?.chatHistory, isGenerating]);
    
    const handleLogout = () => {
        localStorage.clear();
        router.push('/auth/login');
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !activeSession || isGenerating) return;

        const accessToken = localStorage.getItem('accessToken');
        const currentPrompt = prompt;
        
        const newUserMessage: ChatMessage = { role: 'user', content: currentPrompt };
        setActiveSession(prev => prev ? { ...prev, chatHistory: [...prev.chatHistory, newUserMessage] } : null);
        setPrompt('');
        setIsGenerating(true);

        try {
            const response = await api.post(
                `/sessions/${activeSession._id}/generate`,
                { prompt: currentPrompt },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const updatedSession: Session = response.data;
            setActiveSession(updatedSession);
            setSessions(sessions.map(s => s._id === updatedSession._id ? updatedSession : s));
        } catch (err: unknown) { // <-- Correctly typed as unknown
            console.error('Failed to generate code:', err);
            // Revert optimistic UI update on error
            setActiveSession(prev => prev ? { ...prev, chatHistory: prev.chatHistory.slice(0, -1) } : null);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCopyCode = () => {
        if (!activeSession) return;
        const codeToCopy = activeTab === 'jsx' ? activeSession.jsxCode : activeSession.cssCode;
        navigator.clipboard.writeText(codeToCopy);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(''), 2000);
    };

    const handleDownloadZip = async () => {
        if (!activeSession) return;

        const zip = new JSZip();
        zip.file("component.tsx", activeSession.jsxCode);
        zip.file("styles.css", activeSession.cssCode);

        const content = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "component.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading your creative space...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            <aside className="w-72 bg-gray-800 p-4 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">My Components</h1>
                    <button onClick={() => handleNewSession()} title="Create new session" className="p-2 rounded-md bg-gray-700 hover:bg-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {sessions.map((session) => (
                        <div key={session._id} onClick={() => setActiveSession(session)} className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors ${activeSession?._id === session._id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <p className="font-medium truncate">{session.name}</p>
                        </div>
                    ))}
                </div>
                <button onClick={handleLogout} className="mt-4 flex items-center justify-center w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-md hover:bg-red-600 hover:text-white transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V5h10a1 1 0 100-2H3zm12.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L17.586 12H10a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                   Log Out
                </button>
            </aside>

            <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                <div className="flex flex-col flex-1 gap-4">
                    <div className="flex-1 flex flex-col bg-gray-800 rounded-lg shadow">
                        <h2 className="text-lg font-semibold p-4 border-b border-gray-700">Preview</h2>
                        <div className="flex-1 p-2 bg-white rounded-b-lg">
                            <Frame
                                head={<><script src="https://cdn.tailwindcss.com"></script></>}
                                className="w-full h-full border-0"
                            >
                               {activeSession && <ComponentPreview jsxCode={activeSession.jsxCode} cssCode={activeSession.cssCode} />}
                            </Frame>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col bg-gray-800 rounded-lg shadow">
                        <div className="flex justify-between items-center border-b border-gray-700 px-2">
                            <div className="flex">
                                <button onClick={() => setActiveTab('jsx')} className={`py-3 px-4 font-semibold ${activeTab === 'jsx' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>JSX/TSX</button>
                                <button onClick={() => setActiveTab('css')} className={`py-3 px-4 font-semibold ${activeTab === 'css' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>CSS</button>
                            </div>
                            <div className="flex items-center gap-2 pr-2">
                                <button onClick={handleCopyCode} className="text-gray-400 hover:text-white transition-colors text-sm font-semibold p-2 rounded-md bg-gray-700 hover:bg-gray-600">
                                    {copyStatus || 'Copy'}
                                </button>
                                <button onClick={handleDownloadZip} className="text-gray-400 hover:text-white transition-colors text-sm font-semibold p-2 rounded-md bg-gray-700 hover:bg-gray-600">
                                    Download .zip
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-1 relative">
                            <pre className="bg-gray-900 text-gray-300 p-4 rounded-b-md h-full overflow-auto text-sm font-mono">
                                <code>
                                    {activeTab === 'jsx' ? activeSession?.jsxCode : activeSession?.cssCode || '/* No custom CSS. */'}
                                </code>
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="lg:w-96 flex flex-col bg-gray-800 rounded-lg shadow shrink-0">
                    <h2 className="text-lg font-semibold p-4 border-b border-gray-700">Chat</h2>
                    <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {activeSession?.chatHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-lg max-w-xs break-words ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isGenerating && (
                            <div className="flex justify-start">
                                <div className="p-3 bg-gray-700 rounded-lg"><span className="animate-pulse">Generating...</span></div>
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
