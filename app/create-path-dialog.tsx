"use client";

import { ArrowLeft, Check, FileText, Link2, LoaderCircle, Paperclip, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { GeneratedLearningPath, LearningPath, LearningSource } from "@/lib/learning-path";
import { currentModelLabel } from "@/lib/model-routing";
import { storeSourceArtifacts } from "@/lib/source-artifacts";

type CreatePathDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (path: LearningPath) => void;
};

const acceptedFiles = ".pdf,.md,.txt,.csv,.json,application/pdf,text/plain,text/markdown,text/csv,application/json";

function formatFileSize(bytes: number) {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function linkTitle(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function canonicalSourceLink(value: string) {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function CreatePathDialog({ open, onClose, onCreate }: CreatePathDialogProps) {
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [generated, setGenerated] = useState<GeneratedLearningPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => subjectRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isGenerating && !isSaving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isGenerating, isSaving, onClose, open]);

  if (!open) return null;

  const resetGenerated = () => {
    setGenerated(null);
    setError(null);
  };

  const addLink = () => {
    const value = linkInput.trim();
    if (!value) return;
    const canonical = canonicalSourceLink(value);
    if (!canonical) {
      setError("Enter a public HTTPS link.");
      return;
    }
    if (links.includes(canonical)) {
      setLinkInput("");
      return;
    }
    if (links.length >= 4) {
      setError("You can add up to four links.");
      return;
    }
    setLinks((current) => [...current, canonical]);
    setLinkInput("");
    resetGenerated();
  };

  const addFiles = (incoming: File[]) => {
    const supported = incoming.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return file.type === "application/pdf" || file.type.startsWith("text/") || ["csv", "json", "md", "txt"].includes(extension ?? "");
    });
    if (supported.length !== incoming.length) {
      setError("Attach PDF, Markdown, text, CSV, or JSON files.");
      return;
    }
    if (supported.some((file) => file.size > 6_000_000)) {
      setError("Each file must be under 6 MB.");
      return;
    }

    const next = [...files];
    for (const file of supported) {
      if (!next.some((current) => current.name === file.name && current.size === file.size)) next.push(file);
    }
    if (next.length > 4 || next.reduce((total, file) => total + file.size, 0) > 12_000_000) {
      setError("Attach up to four files and 12 MB combined.");
      return;
    }
    setFiles(next);
    resetGenerated();
  };

  const generatePath = async (event: React.FormEvent) => {
    event.preventDefault();
    if (subject.trim().length < 3 || goal.trim().length < 10) {
      setError("Add a subject and a short description of what you want to understand.");
      return;
    }

    let submittedLinks = links;
    if (linkInput.trim()) {
      const pendingLink = canonicalSourceLink(linkInput);
      if (!pendingLink) {
        setError("Enter a public HTTPS link.");
        return;
      }
      submittedLinks = links.includes(pendingLink) ? links : [...links, pendingLink];
      if (submittedLinks.length > 4) {
        setError("You can add up to four links.");
        return;
      }
      setLinks(submittedLinks);
      setLinkInput("");
    }

    setIsGenerating(true);
    setError(null);
    const form = new FormData();
    form.set("subject", subject.trim());
    form.set("goal", goal.trim());
    submittedLinks.forEach((link) => form.append("links", link));
    files.forEach((file) => form.append("files", file));

    try {
      const response = await fetch("/api/paths/generate", { method: "POST", body: form });
      const result = await response.json() as GeneratedLearningPath & { error?: string };
      if (!response.ok) throw new Error(result.error || "The path could not be generated.");
      setGenerated(result);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "The path could not be generated.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addToMap = async () => {
    if (!generated) return;
    const snapshots = new Map(generated.sourceSnapshots.map((entry) => [entry.sourceId, entry.snapshot]));
    const id = `custom-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
    const fileArtifacts = files.map((file, index) => ({
      id: `${id}:file-${index}-${file.name}`,
      file,
    }));
    setIsSaving(true);
    setError(null);
    try {
      await storeSourceArtifacts(fileArtifacts);
    } catch (storageError) {
      setError(storageError instanceof Error ? storageError.message : "The attached files could not be saved on this device.");
      setIsSaving(false);
      return;
    }
    const sourceRefs: LearningSource[] = [
      ...links.map((link, index) => {
        const id = `link-${index}-${link}`;
        return { id, kind: "link" as const, title: linkTitle(link), href: link, detail: "Web source", snapshot: snapshots.get(id) };
      }),
      ...files.map((file, index) => {
        const sourceId = `file-${index}-${file.name}`;
        return { id: sourceId, kind: "file" as const, title: file.name, detail: formatFileSize(file.size), snapshot: snapshots.get(sourceId), artifactId: `${id}:${sourceId}` };
      }),
    ];
    onCreate({
      id,
      title: generated.title,
      description: generated.description,
      progress: 0,
      concepts: generated.concepts,
      next: generated.concepts[0].title,
      status: "Ready to begin",
      relatedPathId: generated.relatedPathId,
      sources: sourceRefs,
      userCreated: true,
      createdAt: new Date().toISOString(),
    });
    setSubject("");
    setGoal("");
    setLinkInput("");
    setLinks([]);
    setFiles([]);
    setGenerated(null);
    setError(null);
    setIsSaving(false);
  };

  return (
    <div className="create-path-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !isGenerating && !isSaving) onClose(); }}>
      <section className="create-path-dialog" role="dialog" aria-modal="true" aria-labelledby="create-path-title">
        <header className="create-path-header">
          <div>
            <span className="create-path-icon"><Plus size={15} /></span>
            <h2 id="create-path-title">Create learning path</h2>
          </div>
          <button className="icon-action" aria-label="Close new path" onClick={onClose} disabled={isGenerating || isSaving}><X size={17} /></button>
        </header>

        {generated ? (
          <div className="path-preview">
            <div className="path-preview-heading">
              <div className="path-preview-kicker"><span>Path outline</span><small>{generated.mode === "live" ? `Planned by ${currentModelLabel(generated.model)}` : "Demo fallback"}</small></div>
              <h3>{generated.title}</h3>
              <p>{generated.description}</p>
            </div>
            <ol className="path-preview-concepts">
              {generated.concepts.map((concept, index) => (
                <li key={`${concept.title}-${index}`}>
                  <span>{index + 1}</span>
                  <div><strong>{concept.title}</strong><p>{concept.objective}</p></div>
                </li>
              ))}
            </ol>
            <div className="path-preview-sources"><Paperclip size={13} /><span>{links.length + files.length || "No"} source{links.length + files.length === 1 ? "" : "s"}</span></div>
            <footer className="create-path-footer">
              <button type="button" className="secondary-path-action" onClick={() => setGenerated(null)} disabled={isSaving}><ArrowLeft size={14} /> Edit inputs</button>
              <button type="button" className="primary-path-action" onClick={addToMap} disabled={isSaving}>{isSaving ? <LoaderCircle className="create-path-spinner" size={14} /> : <Check size={14} />} {isSaving ? "Saving files" : "Add to map"}</button>
            </footer>
          </div>
        ) : (
          <form className="create-path-form" onSubmit={generatePath}>
            <label>
              <span>Subject</span>
              <input ref={subjectRef} value={subject} maxLength={80} onChange={(event) => { setSubject(event.target.value); resetGenerated(); }} placeholder="Causal inference" required />
            </label>
            <label>
              <span>What do you want to understand?</span>
              <textarea value={goal} maxLength={600} onChange={(event) => { setGoal(event.target.value); resetGenerated(); }} placeholder="Build enough intuition to evaluate causal claims and design a small observational study." required />
            </label>

            <fieldset className="path-source-fields">
              <legend>Sources</legend>
              <div className="link-source-input">
                <Link2 size={15} />
                <input
                  type="url"
                  value={linkInput}
                  onChange={(event) => { setLinkInput(event.target.value); setError(null); }}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLink(); } }}
                  placeholder="https://example.com/guide"
                  aria-label="Source link"
                />
                <button type="button" onClick={addLink} aria-label="Add source link" title="Add source link"><Plus size={15} /></button>
              </div>
              {links.length ? (
                <ul className="attached-sources">
                  {links.map((link) => (
                    <li key={link}><Link2 size={13} /><span><strong>{linkTitle(link)}</strong><small>{link}</small></span><button type="button" aria-label={`Remove ${linkTitle(link)}`} onClick={() => { setLinks((current) => current.filter((value) => value !== link)); resetGenerated(); }}><X size={13} /></button></li>
                  ))}
                </ul>
              ) : null}

              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                multiple
                accept={acceptedFiles}
                onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }}
              />
              <button
                type="button"
                className="file-drop-button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}
              >
                <Paperclip size={16} />
                <span><strong>Attach files</strong><small>PDF, Markdown, text, CSV, or JSON</small></span>
              </button>
              {files.length ? (
                <ul className="attached-sources">
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`}><FileText size={13} /><span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => { setFiles((current) => current.filter((value) => value !== file)); resetGenerated(); }}><Trash2 size={13} /></button></li>
                  ))}
                </ul>
              ) : null}
            </fieldset>

            {error ? <p className="create-path-error" role="alert">{error}</p> : null}
            <footer className="create-path-footer">
              <button type="button" className="secondary-path-action" onClick={onClose} disabled={isGenerating}>Cancel</button>
              <button type="submit" className="primary-path-action" disabled={isGenerating}>
                {isGenerating ? <LoaderCircle className="create-path-spinner" size={14} /> : <Plus size={14} />}
                {isGenerating ? "Building path" : "Generate path"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
