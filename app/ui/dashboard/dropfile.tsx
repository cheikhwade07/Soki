"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileText, LoaderCircle, Upload, WandSparkles } from "lucide-react";

type DropFilesProps = {
    deckId?: string;
};

export function DropFiles({ deckId }: DropFilesProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
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
        const pdfFiles = incomingFiles.filter((file) => file.type === "application/pdf");
        setFiles((previousFiles) => [...previousFiles, ...pdfFiles]);

        if (pdfFiles.length !== incomingFiles.length) {
            setMessage("Only PDF files are supported.");
        } else {
            setMessage(null);
        }
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

    const removeFile = (index: number) => {
        setFiles((previousFiles) => previousFiles.filter((_, fileIndex) => fileIndex !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setMessage("Uploading files and preparing generation...");

        setTimeout(() => {
            setUploading(false);
            setMessage(
                deckId
                    ? 'Files staged successfully. Connect the generation backend to turn this PDF into saved cards automatically.'
                    : 'Create a deck first, then connect the generation backend to save cards automatically.',
            );
        }, 800);
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
                    multiple
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                />
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <WandSparkles className="h-6 w-6" />
                </div>
                <p className="text-base font-medium text-slate-900">
                    {isDragging ? "Drop PDF files here" : "Drag and drop PDF files here, or click to browse"}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    Stage lecture slides or notes for card generation. The backend can later convert these files into saved recall prompts.
                </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">1. Upload</p>
                    <p className="mt-2 text-sm text-slate-700">Add PDFs that represent the source material.</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">2. Generate</p>
                    <p className="mt-2 text-sm text-slate-700">Send the file to the generation pipeline when the backend is ready.</p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">3. Review</p>
                    <p className="mt-2 text-sm text-slate-700">Cards save into the deck and become part of active recall.</p>
                </div>
            </div>

            {message && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {message}
                </div>
            )}

            {files.length > 0 && (
                <div className="space-y-4">
                    <ul className="space-y-2">
                        {files.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
                                    onClick={() => removeFile(index)}
                                    className="ml-4 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-slate-900 p-4 text-white">
                        <div>
                            <p className="text-sm font-medium">Ready to stage generation</p>
                            <p className="mt-1 text-xs text-slate-300">
                                {files.length} file{files.length !== 1 ? 's' : ''} selected for this deck.
                            </p>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
                        >
                            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploading ? 'Staging...' : 'Stage Generation'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
