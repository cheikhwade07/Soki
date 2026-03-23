"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { FileText, LoaderCircle, Upload, WandSparkles } from "lucide-react";

type DropFilesProps = {
    deckId?: string;
};

export function DropFiles({ deckId }: DropFilesProps) {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const addPdfFiles = (incomingFiles: File[]) => {
        const pdfFiles = incomingFiles.filter((incomingFile) => incomingFile.type === "application/pdf");

        if (pdfFiles.length === 0) {
            setMessage("Only PDF files are supported.");
            return;
        }

        if (incomingFiles.length > 1 || pdfFiles.length > 1) {
            setMessage("Only one PDF can be uploaded at a time while the generation system is in beta.");
        } else {
            setMessage("Beta note: uploads are currently limited to 5 per day while the generation system is still in beta.");
        }

        setFile(pdfFiles[0]);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        addPdfFiles(Array.from(event.dataTransfer.files));
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            addPdfFiles(Array.from(event.target.files));
        }
    };

    const removeFile = () => {
        setFile(null);
        setMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const readJsonSafely = async (response: Response) => {
        const text = await response.text();

        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch {
            return { raw: text };
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        if (!deckId) {
            setMessage('Create a deck first, then generate cards into it.');
            return;
        }

        setUploading(true);
        setMessage("Uploading your PDF and generating cards...");

        try {
            const formData = new FormData();
            formData.append('deckId', deckId);
            formData.append('file', file);

            const response = await fetch('/api/generate-cards', {
                method: 'POST',
                body: formData,
            });

            const payload = await readJsonSafely(response);

            if (!response.ok) {
                throw new Error(payload?.error ?? payload?.raw ?? 'Failed to generate cards.');
            }

            const totalGenerated = Number(payload?.count ?? 0);

            setFile(null);
            setMessage(`Generated and saved ${totalGenerated} card${totalGenerated !== 1 ? 's' : ''}. Beta note: uploads are limited to 5 per day.`);
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Failed to generate cards.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                />
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <WandSparkles className="h-6 w-6" />
                </div>
                <p className="text-base font-medium text-slate-900">
                    {isDragging ? "Drop a PDF here" : "Drag and drop a PDF here, or click to browse"}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    Upload one PDF at a time and send it straight to the generation backend. Generated cards will be saved into this deck automatically.
                </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">1. Upload</p>
                    <p className="mt-2 text-sm text-slate-700">Add one PDF source file for this deck.</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">2. Generate</p>
                    <p className="mt-2 text-sm text-slate-700">Send it to the FastAPI backend to create study prompts.</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">3. Save</p>
                    <p className="mt-2 text-sm text-slate-700">New cards are inserted into the deck and review queue immediately.</p>
                </div>
            </div>

            {message && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {message}
                </div>
            )}

            {!message && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Beta note: uploads are currently limited to 5 per day while the generation system is still in beta.
                </div>
            )}

            {file && (
                <div className="space-y-4">
                    <ul className="space-y-2">
                        <li className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="rounded-xl bg-red-50 p-2 text-red-500">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button
                                onClick={removeFile}
                                className="ml-4 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                            >
                                Remove
                            </button>
                        </li>
                    </ul>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-slate-900 p-4 text-white">
                        <div>
                            <p className="text-sm font-medium">Ready to generate cards</p>
                            <p className="mt-1 text-xs text-slate-300">
                                1 PDF selected for this deck.
                            </p>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
                        >
                            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploading ? 'Generating...' : 'Generate Cards'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
