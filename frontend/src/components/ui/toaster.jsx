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
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-rose-200">
                  <AlertCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-emerald-200/80">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div className="grid gap-1 flex-1">
                {title && (
                  <ToastTitle
                    className={`text-sm font-bold ${
                      isDestructive ? "text-rose-950" : "text-emerald-950"
                    }`}
                  >
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription
                    className={`text-xs leading-relaxed ${
                      isDestructive ? "text-rose-800" : "text-emerald-800"
                    }`}
                  >
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="rounded-lg text-slate-400 hover:text-slate-700" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
