'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Frame from 'react-frame-component';
import React from 'react';
import { transform } from '@babel/standalone';
import api from '../../lib/axios';
import axios from 'axios';
import JSZip from 'jszip';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Expand, Minimize, LogOut, Plus, Copy, Download, Trash2, X, PanelLeftClose, PanelRightClose, Pencil } from 'lucide-react';


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

interface SelectedElement {
  elementId: string;
  tagName: string;
  styles: {
    backgroundColor: string;
    color: string;
    fontSize: string;
    padding: string;
    textContent: string | null;
  };
}


// --- Component Preview ---
const ComponentPreview = ({ jsxCode, cssCode }: { jsxCode: string; cssCode: string }) => {
  const [ComponentToRender, setComponentToRender] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const rawCode = jsxCode.trim();
      const transformedResult = transform(rawCode, {
        presets: ['react', 'typescript'],
        filename: 'component.tsx',
      });
      if (!transformedResult?.code) throw new Error("Babel transformation returned empty code.");
      
      const factory = new Function('React', `${transformedResult.code}\nreturn GeneratedComponent;`);
      const Component = factory(React);

      if (!Component || (typeof Component !== 'function' && typeof Component !== 'object')) {
          throw new Error('The evaluated code did not produce a valid React component.');
      }
      setComponentToRender(() => Component);
      setError(null);
    } catch (err) {
      console.error("Error rendering component preview:", err);
      setError(String(err));
      setComponentToRender(null);
    }
  }, [jsxCode]);

  useEffect(() => {
    if (componentRef.current) {
      componentRef.current.querySelectorAll('*').forEach((el, index) => {
        const uniqueId = `element-${index}`;
        (el as HTMLElement).dataset.id = uniqueId;
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const existingStyle = window.getComputedStyle(el);
          const styles = {
            backgroundColor: existingStyle.backgroundColor,
            color: existingStyle.color,
            fontSize: existingStyle.fontSize,
            padding: existingStyle.padding,
            textContent: el.textContent,
          };
          window.parent.postMessage({
            type: 'element-click',
            elementId: uniqueId,
            tagName: (el as HTMLElement).tagName,
            styles: styles,
          }, '*');
        });
      });
    }
  }, [ComponentToRender]);


  if (error) {
    return <div style={{ color: '#ef4444', padding: '1rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{error}</div>;
  }

  return (
    <>
      <style>{cssCode}</style>
      {ComponentToRender && <div ref={componentRef}><ComponentToRender /></div>}
    </>
  );
};


// --- Property Panel ---
const PropertyPanel = ({ selectedElement, onDeselect, onStyleChange }: { selectedElement: SelectedElement | null, onDeselect: () => void, onStyleChange: (prompt: string) => void }) => {
    if (!selectedElement) {
        return (
            <div className="p-4 text-gray-400">
                Click an element in the preview to edit its properties.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Editing &lt;{selectedElement.tagName.toLowerCase()}&gt;</h3>
                <button onClick={onDeselect} title="Deselect Element" className="p-1 rounded-full hover:bg-gray-700">
                    <X size={18} />
                </button>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-400">Text Content</label>
                <input
                    type="text"
                    defaultValue={selectedElement.styles.textContent || ''}
                    onBlur={(e) => onStyleChange(`change the text to "${e.target.value}"`)}
                    className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-400">Background Color</label>
                <input
                    type="color"
                    defaultValue={selectedElement.styles.backgroundColor}
                    onChange={(e) => onStyleChange(`change the background color to ${e.target.value}`)}
                    className="w-full mt-1 h-10 p-1 bg-gray-900 border border-gray-700 rounded-md"
                />
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function PlaygroundPage() {
    const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'jsx' | 'css'>('jsx');
    const [copyStatus, setCopyStatus] = useState('');
    const [fullscreenView, setFullscreenView] = useState<'none' | 'preview' | 'code'>('none');
    const [isExitingFullscreen, setIsExitingFullscreen] = useState(false);
    const [activeSideTab, setActiveSideTab] = useState<'chat' | 'properties'>('chat');
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
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
    
    // Effect to check authentication status on component mount
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            setAuthStatus('authenticated');
        } else {
            setAuthStatus('unauthenticated');
        }
    }, []);

    // Effect to handle routing and data fetching based on auth status
    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/auth/login');
            return;
        }

        if (authStatus === 'authenticated') {
            const fetchSessions = async () => {
                const accessToken = localStorage.getItem('accessToken');
                // Double check token exists before fetching
                if (!accessToken) {
                    setAuthStatus('unauthenticated');
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
                        setAuthStatus('unauthenticated');
                    }
                } finally {
                    setDataLoading(false);
                }
            };
            fetchSessions();
        }
    }, [authStatus, router, handleNewSession]);
    
    const handleAPIMessage = useCallback(async (promptToSend: string, targetElement: SelectedElement | null) => {
        if (!promptToSend.trim() || !activeSession || isGenerating) return;

        const accessToken = localStorage.getItem('accessToken');
        const newUserMessage: ChatMessage = { role: 'user', content: promptToSend };
        setActiveSession(prev => prev ? { ...prev, chatHistory: [...prev.chatHistory, newUserMessage] } : null);
        setIsGenerating(true);
        setActiveSideTab('chat');
        
        const payload: { prompt: string, targetElement?: SelectedElement } = { prompt: promptToSend };
        if (targetElement) {
            payload.targetElement = targetElement;
        }

        try {
            const response = await api.post(
                `/sessions/${activeSession._id}/generate`,
                payload,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const updatedSession: Session = response.data;
            setActiveSession(updatedSession);
            setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
            setSelectedElement(null);
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
    }, [activeSession, isGenerating]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'element-click') {
                setSelectedElement(event.data);
                setActiveSideTab('properties');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);


    useEffect(() => {
        scrollToBottom();
    }, [activeSession?.chatHistory, isGenerating]);
    
    const handleLogout = () => {
        localStorage.clear();
        router.push('/auth/login');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        handleAPIMessage(prompt, selectedElement);
        setPrompt('');
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

    const handleDeleteSession = async (sessionIdToDelete: string) => {
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
                    const newSession = await handleNewSession(false);
                    if (newSession) {
                        setActiveSession(newSession);
                    } else {
                        setActiveSession(null);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const handleRenameSession = async (sessionId: string, newName: string) => {
        if (!newName.trim()) return;

        const accessToken = localStorage.getItem('accessToken');
        try {
            const response = await api.put(`/sessions/${sessionId}/rename`, { name: newName }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const updatedSession = response.data;
            setSessions(prev => prev.map(s => s._id === sessionId ? updatedSession : s));
            if (activeSession?._id === sessionId) {
                setActiveSession(updatedSession);
            }
        } catch (err) {
            console.error('Failed to rename session:', err);
        } finally {
            setEditingSessionId(null);
        }
    };

    const handleFullscreenToggle = (view: 'preview' | 'code') => {
        if (fullscreenView === view) {
            setIsExitingFullscreen(true);
            setTimeout(() => {
                setFullscreenView('none');
                setIsExitingFullscreen(false);
            }, 200);
        } else {
            setFullscreenView(view);
        }
    };
    
    const FullscreenButton = ({ view }: { view: 'preview' | 'code' }) => (
        <button
            onClick={() => handleFullscreenToggle(view)}
            title={fullscreenView === view ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-md bg-gray-700 hover:bg-blue-600 transition-colors"
        >
            {fullscreenView === view ? <Minimize size={20} /> : <Expand size={20} />}
        </button>
    );

    if (authStatus === 'checking' || dataLoading) {
        return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading your creative space...</div>;
    }
    
    const previewPanel = (
        <div className="flex-1 flex flex-col bg-gray-800 rounded-lg shadow h-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Preview</h2>
                <FullscreenButton view="preview" />
            </div>
            <div className="flex-1 p-2 bg-white rounded-b-lg min-h-0">
                <Frame
                    // eslint-disable-next-line @next/next/no-sync-scripts
                    head={<><script src="https://cdn.tailwindcss.com"></script></>}
                    className="w-full h-full border-0"
                >
                   {activeSession && <ComponentPreview jsxCode={activeSession.jsxCode} cssCode={activeSession.cssCode} />}
                </Frame>
            </div>
        </div>
    );

    const codePanel = (
        <div className="flex-1 flex flex-col bg-gray-800 rounded-lg shadow min-h-0 h-full">
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
    
    const sidePanel = (
         <div className="lg:w-96 flex flex-col bg-gray-800 rounded-lg shadow shrink-0">
            <div className="flex border-b border-gray-700">
                <button 
                    onClick={() => setActiveSideTab('chat')} 
                    className={`flex-1 py-3 font-semibold ${activeSideTab === 'chat' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Chat
                </button>
                <button 
                    onClick={() => setActiveSideTab('properties')} 
                    className={`flex-1 py-3 font-semibold ${activeSideTab === 'properties' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Properties
                </button>
            </div>
            {activeSideTab === 'chat' ? (
                <div key="chat-panel" className="flex flex-col flex-1 animate-fadeIn min-h-0">
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
                            placeholder={
                                isGenerating ? "Please wait..." 
                                : selectedElement ? `Editing <${selectedElement.tagName.toLowerCase()}>...`
                                : "Describe your component..."
                            }
                            disabled={isGenerating || !activeSession}
                            className="w-full p-3 border border-gray-700 bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </form>
                </div>
            ) : (
                 <div key="properties-panel" className="flex-1 animate-fadeIn overflow-y-auto">
                    <PropertyPanel 
                        selectedElement={selectedElement} 
                        onDeselect={() => setSelectedElement(null)}
                        onStyleChange={(stylePrompt) => handleAPIMessage(stylePrompt, selectedElement)}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            <div className={`flex-1 flex h-full transition-opacity duration-300 ${fullscreenView !== 'none' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <aside className={`bg-gray-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-0 p-0' : 'w-72 p-4'}`}>
                    <div className={`flex items-center justify-between mb-4 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        <h1 className="text-xl font-bold">My Components</h1>
                        <button onClick={() => handleNewSession()} title="Create new session" className="p-2 rounded-md bg-gray-700 hover:bg-blue-600 transition-colors">
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className={`flex-grow overflow-y-auto pr-2 space-y-2 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        {sessions.map((session) => (
                            <div key={session._id} className="group relative">
                                <div onClick={() => setActiveSession(session)} className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors ${activeSession?._id === session._id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    {editingSessionId === session._id ? (
                                        <input
                                            type="text"
                                            defaultValue={session.name}
                                            className="bg-transparent w-full outline-none"
                                            autoFocus
                                            onBlur={(e) => handleRenameSession(session._id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameSession(session._id, e.currentTarget.value);
                                                if (e.key === 'Escape') setEditingSessionId(null);
                                            }}
                                        />
                                    ) : (
                                        <p className="font-medium truncate">{session.name}</p>
                                    )}
                                </div>
                                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingSessionId(session._id)} title="Rename session" className="p-1.5 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session._id); }} title="Delete session" className="p-1.5 rounded-full text-gray-400 hover:bg-red-500 hover:text-white">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleLogout} className={`mt-4 flex items-center justify-center w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-md hover:bg-red-600 hover:text-white transition-colors transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                       <LogOut size={18} className="mr-2" />
                       Log Out
                    </button>
                </aside>
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="bg-gray-800 h-12 self-center rounded-r-lg px-1 text-gray-400 hover:bg-gray-700 hover:text-white">
                    {isSidebarCollapsed ? <PanelRightClose size={20} /> : <PanelLeftClose size={20} />}
                </button>
                 <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-w-0">
                    <div className="flex flex-col flex-1 gap-4 min-w-0 min-h-0">
                        {previewPanel}
                        {codePanel}
                    </div>
                    {sidePanel}
                </main>
            </div>
            
            {fullscreenView === 'preview' && (
                <div className={`fixed inset-0 z-50 p-4 ${isExitingFullscreen ? 'animate-zoomOut' : 'animate-zoomIn'}`}>
                    {previewPanel}
                </div>
            )}
            {fullscreenView === 'code' && (
                <div className={`fixed inset-0 z-50 p-4 ${isExitingFullscreen ? 'animate-zoomOut' : 'animate-zoomIn'}`}>
                    {codePanel}
                </div>
            )}
        </div>
    );
}
