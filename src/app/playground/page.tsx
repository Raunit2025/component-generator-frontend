// src/app/playground/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Frame from 'react-frame-component';
import React from 'react';
// @ts-ignore (Babel is loaded from a script tag and won't have types)
import { transform } from '@babel/standalone';
import api from '../../lib/axios';
import axios from 'axios';
import JSZip from 'jszip';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Expand, Minimize, LogOut, Plus, Copy, Download, Trash2 } from 'lucide-react'; // FIX: Import Trash2 icon


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
    const rawCode = jsxCode.trim();

    const transformedResult = transform(rawCode, {
      presets: ['react', 'typescript'],
      filename: 'component.tsx',
    });

    if (!transformedResult?.code) {
      throw new Error("Babel transformation returned empty code.");
    }
    
    const transformedCode = transformedResult.code;
    
    const factory = new Function('React', `${transformedCode}\nreturn GeneratedComponent;`);
    const ComponentToRender = factory(React);

    if (!ComponentToRender || (typeof ComponentToRender !== 'function' && typeof ComponentToRender !== 'object')) {
        throw new Error('The evaluated code did not produce a valid React component.');
    }
    
    return (
      <>
        <style>{cssCode}</style>
        <ComponentToRender />
      </>
    );
  } catch (error) {
    console.error("Error rendering component preview:", error);
    console.log("Raw JSX code received:", jsxCode);
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
    const [activeTab, setActiveTab] = useState<'jsx' | 'css'>('jsx');
    const [copyStatus, setCopyStatus] = useState('');
    const [fullscreenView, setFullscreenView] = useState<'none' | 'preview' | 'code'>('none');
    const router = useRouter();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    const handleNewSession = useCallback(async (setActive = true) => {
        const accessToken = localStorage.getItem('accessToken');
        try {
            const response = await api.post('/sessions', {}, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const newSession = response.data;
            setSessions(prev => [newSession, ...prev]);
            if(setActive) setActiveSession(newSession);
            return newSession;
        } catch (err) {
            console.error('Failed to create new session:', err);
            return null;
        }
    }, []);

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
                if (response.data && response.data.length > 0) {
                    setSessions(response.data);
                    setActiveSession(response.data[0]);
                } else {
                  await handleNewSession(true);
                }
            } catch (err: unknown) {
                console.error('Failed to fetch sessions:', err);
                 if (axios.isAxiosError(err) && err.response?.status === 401) {
                    router.push('/auth/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, [router, handleNewSession]);

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
        } catch (err: unknown) {
            console.error('Failed to generate code:', err);
            setActiveSession(prev => {
                if (!prev) return null;
                const newChatHistory = prev.chatHistory.filter(msg => msg !== newUserMessage);
                return { ...prev, chatHistory: newChatHistory };
            });
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

    // FIX: Add delete session handler
    const handleDeleteSession = async (sessionIdToDelete: string) => {
        // Simple confirmation to prevent accidental deletion
        if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            return;
        }

        const accessToken = localStorage.getItem('accessToken');
        try {
            await api.delete(`/sessions/${sessionIdToDelete}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const remainingSessions = sessions.filter(s => s._id !== sessionIdToDelete);
            setSessions(remainingSessions);

            if (activeSession?._id === sessionIdToDelete) {
                if (remainingSessions.length > 0) {
                    setActiveSession(remainingSessions[0]);
                } else {
                    const newSession = await handleNewSession(true);
                    if (newSession) {
                        setActiveSession(newSession);
                    } else {
                        setActiveSession(null);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
            // Optionally show an error message to the user
        }
    };

    const FullscreenButton = ({ view }: { view: 'preview' | 'code' }) => (
        <button
            onClick={() => setFullscreenView(prev => prev === view ? 'none' : view)}
            title={fullscreenView === view ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-md bg-gray-700 hover:bg-blue-600 transition-colors"
        >
            {fullscreenView === view ? <Minimize size={20} /> : <Expand size={20} />}
        </button>
    );

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading your creative space...</div>;
    }
    
    const previewPanel = (
        <div className={`flex-1 flex flex-col bg-gray-800 rounded-lg shadow ${fullscreenView === 'preview' ? 'fixed inset-0 z-50 m-4' : ''}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Preview</h2>
                <FullscreenButton view="preview" />
            </div>
            <div className="flex-1 p-2 bg-white rounded-b-lg min-h-0">
                <Frame
                    head={<><script src="https://cdn.tailwindcss.com"></script></>}
                    className="w-full h-full border-0"
                >
                   {activeSession && <ComponentPreview jsxCode={activeSession.jsxCode} cssCode={activeSession.cssCode} />}
                </Frame>
            </div>
        </div>
    );

    const codePanel = (
        <div className={`flex-1 flex flex-col bg-gray-800 rounded-lg shadow min-h-0 ${fullscreenView === 'code' ? 'fixed inset-0 z-50 m-4' : ''}`}>
            <div className="flex justify-between items-center border-b border-gray-700 px-2">
                <div className="flex">
                    <button onClick={() => setActiveTab('jsx')} className={`py-3 px-4 font-semibold ${activeTab === 'jsx' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>JSX/TSX</button>
                    <button onClick={() => setActiveTab('css')} className={`py-3 px-4 font-semibold ${activeTab === 'css' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>CSS</button>
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <button onClick={handleCopyCode} title="Copy Code" className="text-gray-400 hover:text-white transition-colors p-2 rounded-md bg-gray-700 hover:bg-gray-600">
                        {copyStatus ? <span className="text-sm">{copyStatus}</span> : <Copy size={18} />}
                    </button>
                    <button onClick={handleDownloadZip} title="Download .zip" className="text-gray-400 hover:text-white transition-colors p-2 rounded-md bg-gray-700 hover:bg-gray-600">
                        <Download size={18} />
                    </button>
                    <FullscreenButton view="code" />
                </div>
            </div>
            <div className="flex-1 bg-gray-900 rounded-b-md overflow-auto">
                <SyntaxHighlighter
                    language={activeTab === 'jsx' ? 'jsx' : 'css'}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#111827', height: '100%' }}
                    codeTagProps={{ style: { fontFamily: 'var(--font-geist-mono)' } }}
                >
                    {activeTab === 'jsx' ? activeSession?.jsxCode || '' : activeSession?.cssCode || '/* No custom CSS. */'}
                </SyntaxHighlighter>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            {fullscreenView === 'none' && (
                <aside className="w-72 bg-gray-800 p-4 flex flex-col shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold">My Components</h1>
                        <button onClick={() => handleNewSession()} title="Create new session" className="p-2 rounded-md bg-gray-700 hover:bg-blue-600 transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                        {sessions.map((session) => (
                            // FIX: Add a container for the delete button
                            <div key={session._id} className="group relative">
                                <div onClick={() => setActiveSession(session)} className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors ${activeSession?._id === session._id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    <p className="font-medium truncate">{session.name}</p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent the session from being selected
                                        handleDeleteSession(session._id);
                                    }}
                                    title="Delete session"
                                    className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleLogout} className="mt-4 flex items-center justify-center w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-md hover:bg-red-600 hover:text-white transition-colors">
                       <LogOut size={18} className="mr-2" />
                       Log Out
                    </button>
                </aside>
            )}

            {fullscreenView === 'preview' ? previewPanel : fullscreenView === 'code' ? codePanel : (
                 <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-w-0">
                    <div className="flex flex-col flex-1 gap-4 min-w-0 min-h-0">
                        {previewPanel}
                        {codePanel}
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
            )}
        </div>
    );
}
