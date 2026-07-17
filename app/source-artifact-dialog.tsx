"use client";

import { Download, FileText, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { LearningSource } from "@/lib/learning-path";
import { readSourceArtifact } from "@/lib/source-artifacts";

type SourceArtifactDialogProps = {
  source: LearningSource | null;
  onClose: () => void;
};

export function SourceArtifactDialog({ source, onClose }: SourceArtifactDialogProps) {
  const [text, setText] = useState("");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, source]);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    let nextObjectUrl: string | null = null;

    const load = async () => {
      try {
        const artifact = source.artifactId ? await readSourceArtifact(source.artifactId) : null;
        if (cancelled) return;
        const isPdfFile = source.title.toLowerCase().endsWith(".pdf");
        const type = artifact
          ? (isPdfFile && (!artifact.type || artifact.type === "application/octet-stream") ? "application/pdf" : artifact.type || "text/plain")
          : "text/plain";
        const fallbackBlob = source.snapshot?.content ? new Blob([source.snapshot.content], { type: "text/plain" }) : null;
        const blob = artifact?.blob ?? fallbackBlob;
        if (blob) nextObjectUrl = URL.createObjectURL(blob);
        const readableText = artifact && type !== "application/pdf"
          ? await artifact.blob.text()
          : artifact ? "" : source.snapshot?.content ?? "";
        if (cancelled) {
          if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
          return;
        }
        setContentType(type);
        setObjectUrl(nextObjectUrl);
        setText(readableText);
        if (!blob && !readableText) setError("This file is no longer available on this device.");
      } catch {
        if (source.snapshot?.content) {
          const fallback = new Blob([source.snapshot.content], { type: "text/plain" });
          nextObjectUrl = URL.createObjectURL(fallback);
          setContentType("text/plain");
          setObjectUrl(nextObjectUrl);
          setText(source.snapshot.content);
        } else {
          setError("This file could not be opened on this device.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [source]);

  if (!source) return null;
  const isPdf = contentType === "application/pdf";

  return (
    <div className="source-artifact-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="source-artifact-dialog" role="dialog" aria-modal="true" aria-labelledby="source-artifact-title">
        <header className="source-artifact-header">
          <div><FileText size={16} /><span><strong id="source-artifact-title">{source.title}</strong><small>{source.detail ?? "Attached source"}</small></span></div>
          <button className="icon-action" aria-label="Close source" onClick={onClose}><X size={17} /></button>
        </header>
        <div className={`source-artifact-body ${isPdf ? "pdf" : "text"}`} aria-live="polite">
          {loading ? <div className="source-artifact-state"><LoaderCircle className="spinning" size={19} /><span>Opening source</span></div> : null}
          {!loading && isPdf && objectUrl ? <iframe src={objectUrl} title={source.title} /> : null}
          {!loading && !isPdf && text ? <pre>{text}</pre> : null}
          {!loading && error ? <div className="source-artifact-state"><FileText size={19} /><span>{error}</span></div> : null}
        </div>
        <footer className="source-artifact-footer">
          <span>Stored on this device</span>
          {objectUrl ? <a href={objectUrl} download={source.title}><Download size={13} /> Download</a> : null}
        </footer>
      </section>
    </div>
  );
}
