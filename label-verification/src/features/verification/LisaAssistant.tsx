'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, RotateCcw, Sparkles, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { firestore } from '@/services/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { createThread, sendMessage, getThreadMessages, Message } from '@/services/openaiService';

interface LisaAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LisaAssistant({ isOpen, onClose }: LisaAssistantProps) {
  const { user, userProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedPrompts = [
    "How can you help me with TTB label verification?",
    "What are the requirements for wine labels?",
    "How do I verify alcohol content on labels?",
  ];

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load or create thread when panel opens
  useEffect(() => {
    if (isOpen && user) {
      loadOrCreateThread();
    }
  }, [isOpen, user]);

  const loadOrCreateThread = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if user has an existing conversation thread
      const conversationRef = doc(firestore, 'users', user.uid, 'conversations', 'main');
      const conversationDoc = await getDoc(conversationRef);

      let currentThreadId: string;

      if (conversationDoc.exists()) {
        // Load existing thread
        currentThreadId = conversationDoc.data().threadId;
        console.log('Loading existing thread:', currentThreadId);
        
        // Fetch messages from thread
        const threadMessages = await getThreadMessages(currentThreadId);
        setMessages(threadMessages);
      } else {
        // Create new thread
        console.log('Creating new thread...');
        currentThreadId = await createThread();
        
        // Save thread to Firestore
        await setDoc(conversationRef, {
          threadId: currentThreadId,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });
        
        console.log('New thread created:', currentThreadId);
        setMessages([]);
      }

      setThreadId(currentThreadId);
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || message.trim();
    if (!messageText || !threadId || !user) return;

    setIsSending(true);
    setMessage('');

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: Math.floor(Date.now() / 1000),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Send message to OpenAI and get response
      const assistantMessage = await sendMessage(threadId, messageText);
      
      // Add assistant response to UI
      setMessages((prev) => [...prev, assistantMessage]);

      // Update last message timestamp in Firestore
      const conversationRef = doc(firestore, 'users', user.uid, 'conversations', 'main');
      await updateDoc(conversationRef, {
        lastMessageAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please try again.',
          createdAt: Math.floor(Date.now() / 1000),
        },
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create new thread
      const newThreadId = await createThread();
      
      // Update Firestore
      const conversationRef = doc(firestore, 'users', user.uid, 'conversations', 'main');
      await setDoc(conversationRef, {
        threadId: newThreadId,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });
      
      setThreadId(newThreadId);
      setMessages([]);
      console.log('New conversation started:', newThreadId);
    } catch (error) {
      console.error('Error creating new conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Assistant Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <img
                    src="/lisa.png"
                    alt="Lisa"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-semibold text-gray-900">Lisa</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleNewConversation}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="New conversation"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={loadOrCreateThread}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : messages.length === 0 ? (
                <>
                  {/* Greeting */}
                  <div className="mb-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <img
                        src="/lisa.png"
                        alt="Lisa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Hello! I'm Lisa, your TTB Assistant
                    </h2>
                    <p className="text-lg text-gray-600">
                      How can I help you?
                    </p>
                  </div>

                  {/* Suggested Prompts */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-500 mb-3">
                      Get started with a prompt
                    </p>
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-700"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Info Notice */}
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      💡 <strong>Note:</strong> Lisa is your AI assistant for TTB label verification. 
                      She can help you understand requirements and verify label compliance.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Messages */}
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                              <img
                                src="/lisa.png"
                                alt="Lisa"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Message bubble */}
                          <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`rounded-2xl px-4 py-2.5 ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <span className="text-xs text-gray-400 mt-1 px-1">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                            <img
                              src="/lisa.png"
                              alt="Lisa"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="bg-gray-100 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-3 shadow-sm">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Lisa"
                  disabled={isSending || isLoading}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 disabled:opacity-50"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!message.trim() || isSending || isLoading}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  ) : (
                    <Send className={`w-4 h-4 ${message.trim() ? 'text-purple-600' : 'text-gray-400'}`} />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Lisa can make mistakes, so double-check it
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
