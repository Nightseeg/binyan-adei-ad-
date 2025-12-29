import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    addToast: (type: ToastType, message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = uuidv4();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    const success = (msg: string) => addToast('success', msg);
    const error = (msg: string) => addToast('error', msg);
    const info = (msg: string) => addToast('info', msg);
    const warning = (msg: string) => addToast('warning', msg);

    return (
        <ToastContext.Provider value={{ addToast, success, error, info, warning }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <Check className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />
    };

    const borderClass = {
        success: 'border-l-4 border-l-emerald-500',
        error: 'border-l-4 border-l-red-500',
        info: 'border-l-4 border-l-blue-500',
        warning: 'border-l-4 border-l-amber-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className={`pointer-events-auto w-80 shadow-lg rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 flex items-start gap-3 ${borderClass[toast.type]}`}
        >
            <div className="shrink-0 pt-0.5">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{toast.message}</p>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
