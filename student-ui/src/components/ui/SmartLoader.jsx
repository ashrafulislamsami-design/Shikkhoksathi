import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../../data/loadingMessages';
import { Brain, Sparkles } from 'lucide-react';

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
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                backgroundColor: '#fcfaf5',
                backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px)',
                backgroundSize: '32px 32px'
            }}
        >
            <div 
                className="flex flex-col items-center max-w-md text-center p-8 animate-in fade-in zoom-in duration-300"
                style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #1a3300',
                    boxShadow: '6px 6px 0px #1a3300',
                    borderRadius: '16px',
                    color: '#1a3300',
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                <div className="relative mb-8 flex justify-center items-center">
                    {/* Bouncing/Spinning Neo-Brutalist Loader */}
                    <div 
                        className="w-16 h-16 rounded-full animate-spin"
                        style={{
                            border: '4px solid #d5f5c2', // Mint!
                            borderTop: '4px solid #1a3300' // Forest Green!
                        }}
                    />
                    
                    {/* Inner Icon */}
                    <div className="absolute flex items-center justify-center">
                        <Brain size={24} className="text-[#cb5521] animate-pulse" />
                    </div>

                    {/* Retry Indicator */}
                    {isRetrying && (
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span 
                                className="text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                                style={{
                                    color: '#cb5521', // Terracotta
                                    fontFamily: "'Roboto Mono', monospace"
                                }}
                            >
                                <Sparkles size={12} className="animate-spin" /> Optimizing Connection (Attempt {retryCount}/3)
                            </span>
                        </div>
                    )}
                </div>

                <div className={`transition-opacity duration-500 mt-4 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    <h3 className="text-lg font-black mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1a3300' }}>
                        Generating Assessment...
                    </h3>
                    <p className="text-xs font-bold leading-relaxed" style={{ color: 'rgba(26,51,0,0.6)', fontFamily: "'Inter', sans-serif" }}>
                        "{message}"
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SmartLoader;
