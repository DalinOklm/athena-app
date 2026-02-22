"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { parseCSV } from "./csv-parser";
import { validateEmployeeRow } from "./employee-validation";

function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-6 py-5 shadow-lg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">
          {text ?? "Processing..."}
        </p>
      </div>
    </div>
  );
}


export function BulkEmployeeUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitResult, setSubmitResult] = useState<null | {
    success: boolean;
    inserted?: number;
    skipped?: number;
    error?: string;
  }>(null);

  console.log("🟡 BulkEmployeeUploadDialog mounted");


          // ================================
          // Bulk employee submit handler
          // ================================
      const handleSubmit = async () => {
          console.log("🟢 Submit clicked");

          if (submitting) return;

          setSubmitting(true);

          try {
            const res = await fetch("/api/admin/employees/bulk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ employees: rows }),
            });

            const data = await res.json();

            console.log("📦 API response:", data);

            if (!res.ok || !data.success) {
              console.log("❌ Upload failed at API level");
              throw new Error(data.error || "Bulk upload failed");
            }

            console.log("✅ Upload successful");

            // 🔥 Close modal immediately
            onOpenChange(false);

            // 🔥 Reset modal state
            setRows([]);
            setFile(null);
            setSubmitResult(null);

            // 🔥 Trigger global banner
            onSuccess(
              `Successfully inserted ${data.inserted} employees`
            );

          } catch (err: any) {
            console.error("❌ Submit failed:", err.message);

            setSubmitResult({
              success: false,
              error: err.message || "Bulk upload failed",
            });

            // 🔥 Modal stays open on error
          } finally {
            setSubmitting(false);
          }
    };







console.log("🧩 Dialog received open prop =", open);
console.log("🧩 Dialog submitting state =", submitting);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="relative max-w-[900px]"
      onInteractOutside={submitting ? (e) => e.preventDefault() : undefined}
      onEscapeKeyDown={submitting ? (e) => e.preventDefault() : undefined}
    >
       {(() => {
    console.log("📦 DialogContent rendering");
        return null;
      })()}
      {/* 🔴 ADD THIS BLOCK */}
      {submitting && (
        <LoadingOverlay text="Submitting employees…" />
      )}
        
        <DialogHeader>
          <DialogTitle>Bulk Employee Upload</DialogTitle>
        </DialogHeader>

        {/* Upload Area */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              console.log("📁 CSV selected:", f?.name);
              setFile(f);
            }}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Upload a CSV file with employee details
          </p>
        </div>


         {/* Actions */}
<div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          disabled={submitting || completed}
          onClick={() => {
            console.log("🟠 Cancel clicked");

            // Reset everything manually
            setRows([]);
            setFile(null);
            setSubmitResult(null);
            setCompleted(false);
            setSubmitting(false);

            onOpenChange(false);
          }}
        >
          Cancel
        </Button>

  <Button
    disabled={!file}
    onClick={async () => {
      console.log("🧪 Parse & Preview clicked");

      if (!file) return;

      const text = await file.text();
      const parsed = parseCSV(text);

      const validated = parsed.map(r => {
        const result = validateEmployeeRow(r.data);
        return {
          ...r,
          ...result,
        };
      });

      console.log("🔍 Validation result:", validated);
      setRows(validated);
    }}
  >
    Parse & Preview
  </Button>

        <Button
          disabled={rows.length === 0 || submitting || completed}
          onClick={handleSubmit}
        >
          {submitting
            ? "Submitting..."
            : completed
            ? "Completed ✓"
            : "Submit Bulk Upload"}
        </Button>

        {/* ❌ Error Display */}
        {submitResult && !submitResult.success && (
          <div className="mt-4 text-red-600 text-sm">
            ❌ {submitResult.error}
          </div>
        )}

      {submitResult?.success && (
          <div className="mt-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              Successfully inserted {submitResult.inserted} employees
              {submitResult.skipped
                ? ` (${submitResult.skipped} skipped)`
                : ""}
            </div>
          </div>
        )}




</div>

{/* Preview Section — FULL WIDTH */}
{rows.length > 0 && (
  <div className="mt-6 border rounded-lg max-h-[320px] overflow-auto">
    <table className="w-full text-sm">
      <thead className="bg-muted sticky top-0">
        <tr>
          <th className="p-3 text-left">Row</th>
          <th className="p-3 text-left">Email</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.index} className="border-t">
            <td className="p-3">{r.index}</td>
            <td className="p-3">{r.data.email}</td>
            <td className="p-3">
              {r.valid ? "✅ Valid" : "❌ Error"}
            </td>
            <td className="p-3 text-xs text-muted-foreground">
              {[...r.errors, ...r.warnings].join(", ")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}



      </DialogContent>
    </Dialog>
  );
}
