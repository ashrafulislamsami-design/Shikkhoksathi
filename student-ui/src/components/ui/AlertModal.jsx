// student-ui/src/components/ui/AlertModal.jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title = 'Alert', message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Alert Dialog Card */}
            <div 
                className="relative w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200"
                style={{
                    backgroundColor: '#fcfaf5',
                    border: '2px solid #1a3300',
                    boxShadow: '6px 6px 0px #1a3300',
                    borderRadius: '12px',
                    color: '#1a3300',
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    style={{
                        backgroundColor: '#fcfaf5',
                        border: '2px solid #1a3300',
                        boxShadow: '2px 2px 0px #1a3300',
                        borderRadius: '6px',
                        color: '#1a3300',
                        cursor: 'pointer'
                    }}
                >
                    <X size={16} />
                </button>

                {/* Content */}
                <div className="flex items-start gap-3 mt-2">
                    <div 
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center"
                        style={{
                            backgroundColor: '#ffe95c',
                            border: '2px solid #1a3300',
                            borderRadius: '8px',
                            boxShadow: '2px 2px 0px #1a3300'
                        }}
                    >
                        <AlertCircle size={20} className="text-[#1a3300]" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-[#1a3300] uppercase tracking-wider font-mono">
                            {title}
                        </h4>
                        <p className="text-xs font-bold text-[#cb5521] mt-1 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex justify-end mt-5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 font-black rounded-lg text-xs transition-all active:scale-[0.95]"
                        style={{
                            backgroundColor: '#1a3300',
                            color: '#fcfaf5',
                            border: '2px solid #1a3300',
                            boxShadow: '2px 2px 0px #cb5521',
                            cursor: 'pointer'
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
