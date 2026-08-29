import React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "../../lib/utils/cn";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "operational" | "critical" | "warning";
  details?: { label: string; value: string }[];
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  variant = "operational",
  details,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const btnVariants = {
    operational: "bg-emerald-700 hover:bg-emerald-800 text-white",
    critical: "bg-red-700 hover:bg-red-800 text-white",
    warning: "bg-amber-700 hover:bg-amber-800 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[1px]">
      <div className="bg-white rounded border border-slate-300 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 flex items-start gap-3">
          <div className="p-2 rounded bg-slate-100 border border-slate-200 shrink-0 text-slate-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-1.5 font-mono">
            {details.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500 font-sans">{item.label}:</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-3.5 py-1.5 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-sm",
              btnVariants[variant]
            )}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
