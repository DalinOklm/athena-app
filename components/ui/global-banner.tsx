"use client";

import { useEffect } from "react";

export function GlobalBanner({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      className={`fixed top-0 left-0 w-full z-[100] px-6 py-4 text-white ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClose} className="font-bold">
          ✕
        </button>
      </div>
    </div>
  );
}