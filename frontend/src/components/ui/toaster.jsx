import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        const isDestructive = variant === "destructive";

        return (
          <Toast
            key={id}
            variant={variant}
            {...props}
            className="rounded-2xl border p-4 pr-9 shadow-lg text-left"
          >
            <div className="flex items-start gap-3 w-full">
              {isDestructive ? (
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-emerald-200/80 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div className="grid gap-1 flex-1">
                {title && (
                  <ToastTitle
                    className={`text-sm font-bold ${
                      isDestructive
                        ? "text-rose-950 dark:text-rose-200"
                        : "text-emerald-950 dark:text-emerald-200"
                    }`}
                  >
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription
                    className={`text-xs leading-relaxed ${
                      isDestructive
                        ? "text-rose-800 dark:text-rose-300/90"
                        : "text-emerald-800 dark:text-emerald-300/90"
                    }`}
                  >
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
