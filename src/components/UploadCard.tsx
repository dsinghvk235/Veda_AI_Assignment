"use client";

import { useState } from "react";
import { FileImage, FileText, LoaderCircle, Upload, X } from "lucide-react";
import { formatFileSize } from "@/lib/normalize";
import type { PageImage } from "@/lib/types";

export type SelectedFile = {
  file: File;
  pages?: PageImage[];
  previewing?: boolean;
  error?: string;
};

export function UploadCard({
  title,
  hint,
  value,
  onSelect,
  onClear,
  accept = "application/pdf,image/*",
}: {
  title: string;
  hint: string;
  value: SelectedFile | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  accept?: string;
}) {
  const [over, setOver] = useState(false);
  const isPdf = value?.file.name.toLowerCase().endsWith(".pdf") || value?.file.type === "application/pdf";
  const thumb = value?.pages?.[0];
  const filled = Boolean(value && !value.previewing && !value.error);

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onSelect(file);
      }}
      className={`dashed-card relative flex min-h-[168px] cursor-pointer flex-col items-center justify-center rounded-2xl px-5 py-6 text-center transition duration-200 sm:min-h-[180px] ${
        over ? "bg-orange/5" : filled ? "bg-[#faf9f7]" : "hover:bg-[#faf9f7]"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.currentTarget.value = "";
        }}
      />
      {value ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClear();
            }}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-muted shadow-sm hover:bg-zinc-100"
            aria-label={`Remove ${title}`}
          >
            <X size={14} />
          </button>
          {value.previewing ? (
            <>
              <LoaderCircle className="mb-3 h-6 w-6 animate-spin text-muted" />
              <p className="text-sm font-semibold">Reading pages…</p>
              <p className="mt-1 max-w-[220px] truncate text-xs text-muted">{value.file.name}</p>
            </>
          ) : value.error ? (
            <>
              <p className="text-sm font-semibold text-red-600">Couldn’t read file</p>
              <p className="mt-1 max-w-[240px] text-xs text-muted">{value.error}</p>
            </>
          ) : (
            <>
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:${thumb.mimeType};base64,${thumb.data}`}
                  alt=""
                  className="mb-3 h-16 w-12 rounded-md object-cover shadow-sm ring-1 ring-black/5"
                />
              ) : (
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                  {isPdf ? <FileText size={22} /> : <FileImage size={22} />}
                </div>
              )}
              <p className="max-w-[240px] truncate text-sm font-semibold">{value.file.name}</p>
              <p className="mt-1 text-xs text-muted">
                {formatFileSize(value.file.size)}
                {value.pages?.length
                  ? ` · ${value.pages.length} page${value.pages.length === 1 ? "" : "s"}`
                  : ""}
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f1ee] text-muted">
            <Upload size={20} />
          </div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </>
      )}
    </label>
  );
}
