"use client"

import { useState, DragEvent, useRef } from "react";
import {LoaderCircle,Upload} from 'lucide-react'
export  function dropFiles() {
    const [isDragging, setIsDragging] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(prev => [...prev, ...droppedFiles])
    }

    // Also allow clicking to select files
    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        setUploading(true)

        // FormData is what your backend will expect
        const formData = new FormData()
        files.forEach(file => {
            formData.append("files", file)
        })

        try {
            // Swap this URL when your backend is ready
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                // Don't set Content-Type — browser sets it with boundary automatically
            })

            if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

            const data = await res.json()
            console.log("Upload response:", data)
            setFiles([]) // Clear on success
        } catch (err) {
            console.error("Upload error:", err)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                    ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                />
                <p className="text-gray-500">
                    {isDragging ? "Drop files here" : "Drag & drop files here, or click to browse"}
                </p>
            </div>

            {files.length > 0 && (
                <div className="mt-4">
                    <ul className="space-y-2">
                        {files.map((file, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm truncate">
                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 text-sm ml-4"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="items-end mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400 disabled:opacity-50">
                        {uploading ? <LoaderCircle className='animate-spin'/> : <Upload className='animate-bounce'/>}
                    </button>
                </div>
            )}
        </div>
    )
}