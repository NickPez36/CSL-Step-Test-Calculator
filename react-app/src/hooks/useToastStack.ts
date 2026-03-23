import { useState, useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
}

export function useToastStack(durationMs = 5200) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback(
        (message: string, variant: ToastVariant = 'info') => {
            const id = crypto.randomUUID();
            setToasts((prev) => [...prev, { id, message, variant }]);
            if (durationMs > 0) {
                window.setTimeout(() => dismiss(id), durationMs);
            }
        },
        [dismiss, durationMs]
    );

    return { toasts, push, dismiss };
}
