import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../../data/loadingMessages';
import { Loader2, Brain, Sparkles } from 'lucide-react';

const SmartLoader = ({ isRetrying, retryCount, context }) => {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        // If daily challenge, show specific loading text first
        if (context === 'challenge') {
            setMessage("Generatring your Daily Challenge... Beat the streak!");
        }

        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
                setMessage(LOADING_MESSAGES[randomIndex]);
                setFade(true);
            }, 500);
        }, 3000);

        return () => clearInterval(interval);
    }, [context]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md">
            <div className="flex flex-col items-center max-w-md text-center p-6">
                <div className="relative mb-8">
                    {/* Outer Ring */}
                    <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>

                    {/* Inner Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain size={32} className="text-blue-400 animate-pulse" />
                    </div>

                    {/* Retry Indicator */}
                    {isRetrying && (
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={12} /> Optimizing Connection (Attempt {retryCount}/3)
                            </span>
                        </div>
                    )}
                </div>

                <div className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    <h3 className="text-xl font-bold text-white mb-2">Generating Assessment...</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        "{message}"
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SmartLoader;
