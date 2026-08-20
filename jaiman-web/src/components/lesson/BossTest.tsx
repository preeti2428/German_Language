'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2 } from 'lucide-react';

interface BossTestProps {
  prompt: string;
  onCorrect: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export default function BossTest({ prompt, onCorrect }: BossTestProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial bot message
  useEffect(() => {
    setTimeout(() => {
      setMessages([{ id: '1', sender: 'bot', text: 'Hallo! Wie heißt du?' }]);
    }, 1000);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: input.trim() } as ChatMessage];
    setMessages(newMessages);
    setInput('');

    // Simulate basic chat logic for Boss Test
    setTimeout(() => {
      if (stage === 0) {
        // User answered their name
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Freut mich! Woher kommst du?' }]);
        setStage(1);
      } else if (stage === 1) {
        // User answered where they are from, end the test
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Toll! Du hast den Boss Test bestanden.' }]);
        setIsSuccess(true);
        setTimeout(() => {
          onCorrect();
        }, 3000);
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="w-full max-w-lg flex flex-col h-[500px] bg-gray-900 border-2 border-indigo-500 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(79,70,229,0.3)]">
      
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-center">
        <h3 className="font-bold text-white text-lg flex justify-center items-center">
          Boss Test: Chat Roleplay
        </h3>
        <p className="text-indigo-200 text-sm">{prompt}</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] p-3 rounded-2xl ${
                msg.sender === 'user' 
                  ? 'bg-indigo-500 text-white rounded-tr-sm' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center my-4"
            >
              <div className="bg-green-500/20 border border-green-500 text-green-400 px-6 py-2 rounded-full font-bold flex items-center space-x-2">
                <CheckCircle2 />
                <span>Test Passed!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSuccess || messages.length === 0 || messages[messages.length-1].sender === 'user'}
          placeholder="Type your reply..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSuccess}
          className="bg-indigo-600 p-3 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:bg-gray-700 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>

    </div>
  );
}
