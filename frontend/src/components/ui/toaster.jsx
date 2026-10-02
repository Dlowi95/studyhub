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
            className="rounded-2xl p-4 pr-9 text-left"
          >
            <div className="flex items-start gap-3 w-full">
              {isDestructive ? (
                <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-destructive ">
                  <AlertCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-primary/80 ">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div className="grid gap-1 flex-1">
                {title && (
                  <ToastTitle
                    className={`text-sm font-bold ${
                      isDestructive
                        ? "text-destructive "
                        : "text-primary "
                    }`}
                  >
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription
                    className={`text-xs leading-relaxed ${
                      isDestructive
                        ? "text-destructive "
                        : "text-primary "
                    }`}
                  >
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="rounded-lg text-muted-foreground hover:text-foreground " />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
