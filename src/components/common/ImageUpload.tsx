"use client";

import imageCompression from 'browser-image-compression';
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, UploadCloud, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/admin.service";
import { toast } from "@/hooks/use-toast";

interface ImageUploadProps {
    value?: string;
    onChange: (value: string | null) => void;
    disabled?: boolean;
    label?: string | React.ReactNode;
    className?: string;
    companyDomain: string; // Changed from companyId
    maxFiles?: number;
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    label = "Upload Image",
    className,
    companyDomain, // Changed from companyId
    maxFiles = 3,
}: ImageUploadProps) {
    const [filePaths, setFilePaths] = useState<string[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Parse initial value


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!companyDomain) {
            toast({ title: "Error", description: "Company Domain is missing", variant: "destructive" });
            return;
        }

        if (filePaths.length >= maxFiles) {
            toast({ title: "Limit Reached", description: `You can only upload up to ${maxFiles} images.`, variant: "destructive" });
            return;
        }

        // local preview
        const objectUrl = URL.createObjectURL(file);

        // Optimistically update preview BUT NOT filePaths yet
        const newPreviews = [...previews, objectUrl];
        setPreviews(newPreviews);
        setIsUploading(true);

        try {
            // Compress Image
            console.log(`Original File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

            const options = {
                maxSizeMB: 0.3,
                maxWidthOrHeight: 1200,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(file, options);
            console.log(`Compressed File Size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

            // 1. Get Signed URL
            const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const { signedUrl, filePath } = await adminService.getSignedUploadUrl(
                companyDomain,
                uniqueFileName,
                compressedFile.type // Use compressed file type
            );

            // 2. Upload to GCP
            const response = await fetch(signedUrl, {
                method: "PUT",
                body: compressedFile, // Upload compressed file
                headers: {
                    "Content-Type": compressedFile.type,
                },
                credentials: 'omit',
                mode: 'cors',
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            console.log(`[ImageUpload] Upload Success: ${response.status} ${response.statusText}`);

            // 3. Update Parent with concatenated string
            const newPaths = [...filePaths, filePath];
            setFilePaths(newPaths);
            onChange(newPaths.join("&&&"));

            toast({ title: "Success", description: "Image uploaded successfully" });

        } catch (error) {
            console.error("[ImageUpload] Error:", error);
            toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
            // Revert preview on failure
            setPreviews(previews);
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again if needed (though unlikely for valid use case)
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const handleRemove = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const newPaths = filePaths.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        setFilePaths(newPaths);
        setPreviews(newPreviews);

        onChange(newPaths.length > 0 ? newPaths.join("&&&") : null);
    };

    const handleClick = () => {
        if (!disabled && !isUploading && inputRef.current && filePaths.length < maxFiles) {
            inputRef.current.click();
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <Label>{label} <span className="text-xs text-muted-foreground ml-1">(Max {maxFiles})</span></Label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Render Previews */}
                {previews.map((previewUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-background group">
                        <Image
                            src={previewUrl}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized={previewUrl.startsWith('blob:')}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={(e) => handleRemove(e, index)}
                                disabled={disabled || isUploading}
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Upload Button */}
                {filePaths.length < maxFiles && (
                    <div
                        onClick={handleClick}
                        className={cn(
                            "relative flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 transition-all hover:bg-secondary/50 cursor-pointer overflow-hidden",
                            (disabled || isUploading) && "opacity-50 cursor-not-allowed hover:bg-transparent"
                        )}
                    >
                        <Input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={disabled || isUploading}
                        />

                        {isUploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                                <Plus className="w-8 h-8 mb-2" />
                                <span className="text-xs font-medium">Add Image</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
