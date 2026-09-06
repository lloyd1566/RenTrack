"use client";

import { Download, Printer, X } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
  payment?: {
    tenantName?: string;
    paymentDate?: string;
    id?: string;
  };
}

export default function ReceiptModal({ isOpen, onClose, receiptUrl, payment }: ReceiptModalProps) {
  if (!isOpen || !receiptUrl) return null;

  const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "";
  const isPdf = receiptUrl.toLowerCase().endsWith(".pdf");
  const fileExtension = isPdf ? "pdf" : receiptUrl.startsWith("data:image/svg") ? "svg" : "jpg";

  const handleSave = () => {
    const downloadLink = document.createElement("a");
    downloadLink.href = receiptUrl;
    downloadLink.download = `renttrack-receipt-${payment?.id || "payment"}.${fileExtension}`;
    downloadLink.rel = "noopener";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.35)]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:text-slate-900"
          aria-label="Close receipt"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Official Receipt</p>
              <h2 className="mt-2 text-2xl font-bold">RentTrack Payment</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
                {paymentDate || "Receipt issued"}
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
              >
                <Download className="h-3.5 w-3.5" />
                Save
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 sm:p-5">
          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            {isPdf ? (
              <iframe
                src={receiptUrl}
                title="Official payment receipt"
                className="h-[75vh] w-full bg-white"
              />
            ) : (
              <img
                src={receiptUrl}
                alt="Official payment receipt"
                className="h-auto max-h-[75vh] w-full object-contain"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
