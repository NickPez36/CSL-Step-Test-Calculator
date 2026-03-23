import type { ToastItem, ToastVariant } from '../hooks/useToastStack';

export type { ToastItem, ToastVariant };

interface ToastStackProps {
    toasts: ToastItem[];
    onDismiss: (id: string) => void;
}

const variantStyles: Record<ToastVariant, string> = {
    success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-50',
    error: 'border-red-500/40 bg-red-950/90 text-red-50',
    info: 'border-sky-500/40 bg-slate-900/95 text-slate-100',
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
    return (
        <div
            className="fixed bottom-4 right-4 z-[100] flex max-w-md flex-col gap-2 pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${variantStyles[t.variant]}`}
                >
                    <p className="leading-snug">{t.message}</p>
                    <button
                        type="button"
                        onClick={() => onDismiss(t.id)}
                        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/30"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
