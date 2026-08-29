"use client";

import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "../../lib/utils/cn";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "operational";
  details?: Array<{ label: string; value: string }>;
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-[6px] border border-black/[0.08] shadow-xl max-w-md w-full p-4.5 space-y-3.5 z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {variant === "danger" ? (
              <div className="p-1 rounded-[3px] bg-red-100 text-red-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1 rounded-[3px] bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-sm font-bold text-gray-950 font-mono tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[3px] text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed">{description}</p>

        {/* Operational Key Details */}
        {details && details.length > 0 && (
          <div className="bg-gray-50/80 border border-black/[0.05] rounded-[4px] p-2.5 space-y-1.5 text-xs font-mono">
            {details.map((d, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500">{d.label}:</span>
                <span className="font-semibold text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/[0.04]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[4px] text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors touch-press"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              "px-3.5 py-1.5 rounded-[4px] text-xs font-bold font-mono text-white transition-colors touch-press shadow-sm",
              variant === "danger"
                ? "bg-red-700 hover:bg-red-800"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-gray-950 hover:bg-gray-900"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
