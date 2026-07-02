import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../../data/loadingMessages';

const SmartLoader = ({ isRetrying, retryCount, context }) => {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        if (context === 'challenge') {
            setMessage("Generating your Daily Challenge... Beat the streak!");
        }

        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
            setMessage(LOADING_MESSAGES[randomIndex]);
        }, 3000);

        return () => clearInterval(interval);
    }, [context]);

    return (
        <div 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
            style={{
                backgroundColor: '#fcfaf5',
                backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                fontFamily: "'Roboto Mono', monospace"
            }}
        >
            <div className="text-center p-8 max-w-md animate-pulse">
                <div className="text-[10px] uppercase tracking-widest text-[#1a3300] font-black mb-3">
                    {isRetrying ? `OPTIMIZING CONNECTION (ATTEMPT ${retryCount}/3)...` : 'GENERATING ASSESSMENT...'}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[#cb5521] font-bold">
                    "{message}"
                </div>
            </div>
        </div>
    );
};

export default SmartLoader;
